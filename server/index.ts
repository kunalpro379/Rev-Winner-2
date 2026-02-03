import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import TeamsIntegration from "./teams-integration";
import { storage } from "./storage";
import { performanceMonitor } from "./middleware/performance-logger";
import 'dotenv/config';

// Track last auto-rebuild time to prevent excessive rebuilds
let lastAutoRebuildTime = 0;
const AUTO_REBUILD_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown

const app = express();

// Trust proxy for accurate client IP detection behind load balancers
// This enables req.ip to use X-Forwarded-For header
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// SEO: Redirect www to non-www (apex domain) for canonical URL consistency
app.use((req, res, next) => {
  const host = req.get('host') || '';
  if (host.startsWith('www.')) {
    const newHost = host.replace('www.', '');
    const protocol = req.protocol;
    return res.redirect(301, `${protocol}://${newHost}${req.originalUrl}`);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const isError = res.statusCode >= 400;
      performanceMonitor.recordRequest(path, duration, isError);
      
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('Starting application initialization...');
    
    const server = await registerRoutes(app);
    console.log('Routes registered successfully');

    // Initialize Teams Integration (only if credentials are available)
    if (process.env.MICROSOFT_APP_ID && process.env.MICROSOFT_APP_PASSWORD) {
      try {
        const teamsIntegration = new TeamsIntegration(app, storage, {
          microsoftAppId: process.env.MICROSOFT_APP_ID,
          microsoftAppPassword: process.env.MICROSOFT_APP_PASSWORD,
          oauthRedirectUri: process.env.OAUTH_REDIRECT_URI || `${process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}` : 'http://localhost:5000'}/api/teams/auth/callback`
        });

        // Initialize WebSocket for Teams integration
        teamsIntegration.initializeWebSocket(server);
        console.log('Teams integration initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Teams integration:', error);
        // Continue without Teams integration - not critical for app startup
      }
    } else {
      console.log('Teams integration disabled - Microsoft App credentials not configured');
    }

    // Initialize scheduled jobs for operations automation
    try {
      const { initializeScheduledJobs } = await import('./services/scheduled-jobs');
      initializeScheduledJobs();
    } catch (error) {
      console.error('Failed to initialize scheduled jobs:', error);
      // Continue without scheduled jobs - not critical for immediate app startup
    }

    // Initialize and log payment gateway configuration
    try {
      const { logPaymentGatewayConfig } = await import('./config/payment.config');
      const { initializeDefaultGateway } = await import('./services/billing/init-gateway');
      
      logPaymentGatewayConfig();
      await initializeDefaultGateway();
    } catch (error) {
      console.error('Failed to initialize payment gateway:', error);
      // Continue without payment gateway - not critical for immediate app startup
    }

    // Auto-seed marketing dummy data in development if database is empty
    try {
      const { db } = await import('./db');
      const { conversationMinutesBackup } = await import('@shared/schema');
      const { count } = await import('drizzle-orm');
      
      const [result] = await db.select({ total: count() }).from(conversationMinutesBackup);
      
      if (result.total === 0) {
        console.log(' No marketing backup data found - auto-seeding dummy data...');
        const { seedMarketingDummyData } = await import('./data/dummy-backups/seed-marketing-data');
        const seedResult = await seedMarketingDummyData();
        console.log(`Seeded ${seedResult.backupsCreated} backups across ${seedResult.domainsCreated} domains`);
      } else {
        console.log(` Marketing data exists: ${result.total} backups in database`);
      }
    } catch (error: any) {
      // Check if it's a DNS/connection error
      if (error?.code === 'ENOTFOUND' || error?.message?.includes('getaddrinfo')) {
        console.warn('⚠️  Database connection failed - Neon database may be paused or unreachable.');
        console.warn('   If using Neon, wake up your database from the Neon dashboard.');
        console.warn('   This is non-critical for app startup, but database operations may fail.');
      } else {
        console.error('Failed to check/seed marketing data:', error);
      }
      // Continue without seeding - not critical for app startup
    }

    // AUTO-REBUILD KNOWLEDGE: Disabled in development to save tokens
    if (process.env.NODE_ENV === 'production') {
      // This ensures pricing and product data is properly extracted from uploaded Train Me documents
      setImmediate(async () => {
        try {
          const { db } = await import('./db');
          const { domainExpertise, trainingDocuments, knowledgeEntries } = await import('@shared/schema');
          const { eq, and, sql } = await import('drizzle-orm');
          
          // Find domains with completed documents that haven't been processed for knowledge extraction
          // Check both knowledge entries count AND knowledgeExtractedAt to avoid infinite loops
          const domainsWithDocs = await db.execute(sql`
            SELECT DISTINCT de.id, de.name, de.user_id,
              (SELECT COUNT(*) FROM training_documents td 
               WHERE td.domain_expertise_id = de.id AND td.processing_status = 'completed') as doc_count,
              (SELECT COUNT(*) FROM knowledge_entries ke 
               WHERE ke.domain_expertise_id = de.id) as entry_count,
              (SELECT COUNT(*) FROM training_documents td 
               WHERE td.domain_expertise_id = de.id AND td.processing_status = 'completed' 
               AND td.knowledge_extracted_at IS NULL) as unprocessed_doc_count
            FROM domain_expertise de
            WHERE EXISTS (
              SELECT 1 FROM training_documents td 
              WHERE td.domain_expertise_id = de.id AND td.processing_status = 'completed'
              AND td.knowledge_extracted_at IS NULL
            )
          `);
          
          // Only rebuild if there are unprocessed documents (not just missing knowledge entries)
          const domainsNeedingRebuild = (domainsWithDocs.rows as any[]).filter(
            (d: any) => Number(d.unprocessed_doc_count) > 0
          );
          
          if (domainsNeedingRebuild.length > 0) {
            console.log(`AUTO-REBUILD: Found ${domainsNeedingRebuild.length} domains with unprocessed documents`);
            
            const { rebuildKnowledgeBase } = await import('./services/knowledgeExtraction');
            const { invalidateTrainingContextCache } = await import('./services/openai');
            
            for (const domain of domainsNeedingRebuild) {
              try {
                console.log(`Processing unprocessed documents for domain "${domain.name}" (${domain.unprocessed_doc_count} unprocessed)...`);
                const result = await rebuildKnowledgeBase(domain.id, domain.user_id, false); // Incremental only
                console.log(`Knowledge extraction completed for "${domain.name}": ${result.newEntriesAdded} entries created`);
                invalidateTrainingContextCache(domain.user_id);
              } catch (rebuildError: any) {
                console.error(`❌ Knowledge extraction failed for "${domain.name}":`, rebuildError.message);
              }
            }
          } else {
            console.log('All documents processed - no auto-rebuild needed');
          }
        } catch (error: any) {
          console.error('Knowledge auto-rebuild check failed:', error.message);
        }
      });
    } else {
      console.log('AUTO-REBUILD: Disabled in development mode to save API tokens');
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Log the error but don't crash the server
      console.error('Request error:', err.message);
      if (err.stack) {
        console.error('Stack:', err.stack);
      }

      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
    const isDevelopment = nodeEnv === 'development';
    
    // Check if build directory exists for production mode
    const fs = await import('fs');
    const path = await import('path');
    const buildDir = path.default.resolve(import.meta.dirname, 'public');
    const buildExists = fs.default.existsSync(buildDir);
    
    console.log(` Environment check:`);
    console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`  isDevelopment: ${isDevelopment}`);
    console.log(`  Build directory exists: ${buildExists}`);
    
    // Use Vite dev server if in development mode OR if build directory doesn't exist
    if (isDevelopment || !buildExists) {
      if (!isDevelopment && !buildExists) {
        console.log('⚠️ Production mode but no build found, falling back to Vite dev server...');
      } else {
        console.log('Setting up Vite development server...');
      }
      await setupVite(app, server);
    } else {
      console.log('Setting up static file serving for production...');
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Handle server errors (e.g., port binding issues)
    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error('❌ FATAL ERROR: Server failed to start');
      console.error('Error:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
      } else if (error.code === 'EACCES') {
        console.error(`Permission denied to bind to port ${port}`);
      }
      process.exit(1);
    });
    
    // On Windows, use localhost instead of 0.0.0.0 and don't use reusePort
    const isWindows = process.platform === 'win32';
    const host = isWindows ? 'localhost' : '0.0.0.0';
    const listenOptions = {
      port: port,
      host: host,
    };
    
    // reusePort is not supported on Windows
    if (!isWindows) {
      (listenOptions as any).reusePort = true;
    }
    
    server.listen(listenOptions, () => {
      log(`serving on port ${port}`);
      console.log(`✓ Application started successfully in ${process.env.NODE_ENV || 'production'} mode`);
    });

  } catch (error) {
    console.error('❌ FATAL ERROR: Application failed to start');
    
    if (error instanceof Error) {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error:', error);
    }
    
    console.error('Environment:', process.env.NODE_ENV || 'production');
    console.error('Database URL configured:', !!process.env.DATABASE_URL);
    console.error('Port:', process.env.PORT || '5000');
    
    process.exit(1);
  }
})();
