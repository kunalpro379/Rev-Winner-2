import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function verifyAdminUser() {
  console.log('🔍 Verifying admin user...\n');
  
  try {
    // Check if admin user exists
    const users = await sql`
      SELECT id, email, username, role, status, hashed_password, created_at
      FROM auth_users
      WHERE email = 'admin@revwinner.com' OR username = 'admin'
    `;
    
    if (users.length === 0) {
      console.log('❌ Admin user not found!');
      console.log('\nCreating admin user now...\n');
      
      const hashedPassword = await bcrypt.hash('f99e96aa05c82252', 10);
      
      const [newAdmin] = await sql`
        INSERT INTO auth_users (
          email, username, hashed_password, first_name, last_name, 
          role, status, created_at, updated_at
        ) VALUES (
          'admin@revwinner.com', 'admin', ${hashedPassword}, 'Admin', 'User',
          'super_admin', 'active', NOW(), NOW()
        )
        RETURNING id, email, username, role, status
      `;
      
      console.log('✅ Admin user created successfully!');
      console.log(newAdmin);
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log('-------------------');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Username: ${user.username}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
      console.log(`Has Password: ${user.hashed_password ? 'Yes' : 'No'}`);
      console.log(`Created: ${user.created_at}`);
      console.log('-------------------\n');
    });
    
    // Test password verification
    const adminUser = users[0];
    if (adminUser.hashed_password) {
      const testPassword = 'f99e96aa05c82252';
      const isValid = await bcrypt.compare(testPassword, adminUser.hashed_password);
      
      console.log('🔐 Password Test:');
      console.log(`Test Password: ${testPassword}`);
      console.log(`Password Valid: ${isValid ? '✅ YES' : '❌ NO'}`);
      
      if (!isValid) {
        console.log('\n⚠️ Password mismatch! Updating password...');
        const newHashedPassword = await bcrypt.hash(testPassword, 10);
        
        await sql`
          UPDATE auth_users
          SET hashed_password = ${newHashedPassword}, updated_at = NOW()
          WHERE id = ${adminUser.id}
        `;
        
        console.log('✅ Password updated successfully!');
      }
    } else {
      console.log('❌ Admin user has no password set!');
      console.log('Setting password now...');
      
      const hashedPassword = await bcrypt.hash('f99e96aa05c82252', 10);
      await sql`
        UPDATE auth_users
        SET hashed_password = ${hashedPassword}, updated_at = NOW()
        WHERE id = ${adminUser.id}
      `;
      
      console.log('✅ Password set successfully!');
    }
    
    console.log('\n✅ Admin verification complete!');
    console.log('\nLogin Credentials:');
    console.log('==================');
    console.log('Email: admin@revwinner.com');
    console.log('Username: admin');
    console.log('Password: f99e96aa05c82252');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyAdminUser();
