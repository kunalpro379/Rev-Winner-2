import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createTermsTable() {
  console.log('🔧 Creating terms_and_conditions table...\n');
  
  try {
    // Create terms_and_conditions table
    console.log('Creating terms_and_conditions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS terms_and_conditions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL DEFAULT 'Terms & Conditions',
        content TEXT NOT NULL,
        version VARCHAR(20) NOT NULL DEFAULT '1.0',
        is_active BOOLEAN DEFAULT true,
        last_modified_by VARCHAR NOT NULL REFERENCES auth_users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ terms_and_conditions table created');

    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_terms_active ON terms_and_conditions(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_terms_version ON terms_and_conditions(version)`;
    console.log('✅ Indexes created');

    // Get admin user ID for default terms
    const [admin] = await sql`
      SELECT id FROM auth_users 
      WHERE role = 'super_admin' OR role = 'admin'
      ORDER BY created_at ASC
      LIMIT 1
    `;

    if (!admin) {
      console.log('⚠️ No admin user found. Please create an admin user first.');
      return;
    }

    // Insert default terms and conditions
    console.log('\n📝 Inserting default terms and conditions...');
    
    const defaultTerms = `
# Rev Winner Terms & Conditions

**Effective Date:** November 2025  
**Product of:** Healthcaa Technologies India Private Limited

## 1. Acceptance of Terms

By accessing and using Rev Winner, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.

## 2. Service Description

Rev Winner is a sales enablement platform that provides:
- Real-time conversation intelligence
- AI-powered sales coaching
- Call transcription and analysis
- Sales performance analytics

## 3. User Accounts

### 3.1 Registration
- You must provide accurate and complete information
- You are responsible for maintaining account security
- You must be at least 18 years old to use this service

### 3.2 Account Security
- Keep your password confidential
- Notify us immediately of any unauthorized access
- You are responsible for all activities under your account

## 4. Acceptable Use

You agree NOT to:
- Use the service for any illegal purposes
- Attempt to gain unauthorized access to our systems
- Interfere with or disrupt the service
- Upload malicious code or viruses
- Violate any applicable laws or regulations

## 5. Privacy and Data Protection

- We collect and process data as described in our Privacy Policy
- You retain ownership of your data
- We implement industry-standard security measures
- We comply with applicable data protection laws

## 6. Subscription and Payments

### 6.1 Subscription Plans
- Various subscription tiers are available
- Prices are subject to change with notice
- Subscriptions auto-renew unless cancelled

### 6.2 Refunds
- Refund policy applies as per our Refund Policy
- No refunds for partial months
- Contact support for refund requests

## 7. Intellectual Property

- Rev Winner and its content are protected by copyright
- You may not copy, modify, or distribute our content
- Your data remains your property

## 8. Limitation of Liability

Rev Winner is provided "as is" without warranties. We are not liable for:
- Service interruptions or downtime
- Data loss or corruption
- Indirect or consequential damages
- Third-party actions or content

## 9. Termination

We may terminate or suspend your account if you:
- Violate these terms
- Engage in fraudulent activity
- Fail to pay subscription fees

## 10. Changes to Terms

- We may update these terms at any time
- Continued use constitutes acceptance of changes
- We will notify users of significant changes

## 11. Governing Law

These terms are governed by the laws of India.

## 12. Contact Information

For questions about these terms:
- Email: support@revwinner.com
- Website: https://revwinner.com

---

**Last Updated:** November 2025
`;

    await sql`
      INSERT INTO terms_and_conditions (
        title, content, version, is_active, last_modified_by
      ) VALUES (
        'Rev Winner Terms & Conditions',
        ${defaultTerms},
        '1.0',
        true,
        ${admin.id}
      )
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ Default terms and conditions inserted');

    // Verify table
    console.log('\n📊 Verifying table...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'terms_and_conditions'
    `;
    
    if (tables.length > 0) {
      console.log('✅ terms_and_conditions table verified');
      
      // Count terms
      const count = await sql`SELECT COUNT(*) as count FROM terms_and_conditions`;
      console.log(`✅ ${count[0].count} terms version(s) created`);
    }

    console.log('\n🎉 Terms and Conditions table created successfully!');
    console.log('\n✅ You can now manage terms in the admin panel!');

  } catch (error) {
    console.error('❌ Error creating terms_and_conditions table:', error);
    process.exit(1);
  }
}

createTermsTable();
