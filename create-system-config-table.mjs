import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createSystemConfigTable() {
  console.log('🔧 Creating system_config table...\n');
  
  try {
    // Create system_config table
    console.log('Creating system_config table...');
    await sql`
      CREATE TABLE IF NOT EXISTS system_config (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        section VARCHAR(50) NOT NULL,
        description TEXT,
        updated_by VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ system_config table created');

    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_system_config_section ON system_config(section)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key)`;
    console.log('✅ Indexes created');

    // Insert default configuration values
    console.log('\n📝 Inserting default configuration...');
    
    const defaultConfigs = [
      // Email settings
      { key: 'smtpHost', value: 'smtp.gmail.com', section: 'email', description: 'SMTP server host' },
      { key: 'smtpPort', value: '587', section: 'email', description: 'SMTP server port' },
      { key: 'fromName', value: 'Rev Winner', section: 'email', description: 'Email sender name' },
      { key: 'enableEmailNotifications', value: 'true', section: 'email', description: 'Enable email notifications' },
      
      // Payment settings
      { key: 'defaultGateway', value: 'razorpay', section: 'payment', description: 'Default payment gateway' },
      { key: 'enableTestMode', value: 'true', section: 'payment', description: 'Enable test mode for payments' },
      
      // AI settings
      { key: 'defaultProvider', value: 'openai', section: 'ai', description: 'Default AI provider' },
      { key: 'defaultModel', value: 'gpt-4', section: 'ai', description: 'Default AI model' },
      { key: 'maxTokens', value: '2000', section: 'ai', description: 'Maximum tokens per request' },
      { key: 'temperature', value: '0.7', section: 'ai', description: 'AI temperature setting' },
      { key: 'enableAiFeatures', value: 'true', section: 'ai', description: 'Enable AI features' },
      
      // System settings
      { key: 'siteName', value: 'Rev Winner', section: 'system', description: 'Application name' },
      { key: 'siteUrl', value: 'https://revwinner.com', section: 'system', description: 'Application URL' },
      { key: 'supportEmail', value: 'support@revwinner.com', section: 'system', description: 'Support email address' },
      { key: 'maintenanceMode', value: 'false', section: 'system', description: 'Maintenance mode status' },
      { key: 'allowRegistration', value: 'true', section: 'system', description: 'Allow new user registration' },
      { key: 'requireEmailVerification', value: 'false', section: 'system', description: 'Require email verification' },
      { key: 'sessionTimeout', value: '3600', section: 'system', description: 'Session timeout in seconds' },
      { key: 'maxUploadSize', value: '10', section: 'system', description: 'Maximum upload size in MB' },
    ];

    for (const config of defaultConfigs) {
      await sql`
        INSERT INTO system_config (key, value, section, description)
        VALUES (${config.key}, ${config.value}, ${config.section}, ${config.description})
        ON CONFLICT (key) DO NOTHING
      `;
    }
    console.log('✅ Default configuration inserted');

    // Verify table
    console.log('\n📊 Verifying table...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'system_config'
    `;
    
    if (tables.length > 0) {
      console.log('✅ system_config table verified');
      
      // Count configs
      const count = await sql`SELECT COUNT(*) as count FROM system_config`;
      console.log(`✅ ${count[0].count} configuration entries created`);
    }

    console.log('\n🎉 System configuration table created successfully!');
    console.log('\n✅ You can now use System Configuration in the admin panel!');

  } catch (error) {
    console.error('❌ Error creating system_config table:', error);
    process.exit(1);
  }
}

createSystemConfigTable();
