import { Request, Response, NextFunction } from "express";
import { json } from "express";

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

/**
 * Express middleware to capture raw request body for webhook signature verification
 * Must be used BEFORE other body parsers
 * 
 * Usage:
 * app.use('/api/webhooks', captureRawBody);
 * app.use(express.json());
 */
export function captureRawBody(req: Request, res: Response, next: NextFunction) {
  if (req.path.includes('/webhook')) {
    let rawBody = '';
    req.setEncoding('utf8');
    
    req.on('data', (chunk: string) => {
      rawBody += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = rawBody;
      // Parse JSON manually for webhook routes
      try {
        req.body = JSON.parse(rawBody);
      } catch (error) {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
}

/**
 * Alternative: Use express.json with verify option
 * This captures raw body while still parsing JSON automatically
 */
export const jsonWithRawBody = json({
  verify: (req: any, res, buf, encoding) => {
    req.rawBody = buf.toString((encoding as BufferEncoding) || 'utf8');
  }
});
