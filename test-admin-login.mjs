import fetch from 'node-fetch';

async function testAdminLogin() {
  console.log('🔐 Testing admin login...\n');
  
  const loginData = {
    usernameOrEmail: 'admin',
    password: 'f99e96aa05c82252'
  };
  
  console.log('Login Request:');
  console.log('URL: http://localhost:5000/api/admin/login');
  console.log('Body:', JSON.stringify(loginData, null, 2));
  console.log('\nSending request...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log('\nAccess Token:', data.accessToken ? 'Present' : 'Missing');
      console.log('Refresh Token:', data.refreshToken ? 'Present' : 'Missing');
    } else {
      console.log('\n❌ Login failed!');
      console.log('Error:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('\n⚠️ Make sure the server is running: npm run dev');
  }
}

testAdminLogin();
