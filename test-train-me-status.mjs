#!/usr/bin/env node

/**
 * Test script for Train Me status endpoint
 * Tests that the endpoint returns 200 and doesn't crash with 500 error
 */

import { config } from 'dotenv';
config();

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testTrainMeStatus() {
  console.log('🧪 Testing Train Me Status Endpoint\n');
  
  // You need to provide a valid access token
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ Usage: node test-train-me-status.mjs <ACCESS_TOKEN>');
    console.log('\nTo get your access token:');
    console.log('1. Login to Rev Winner');
    console.log('2. Open browser console');
    console.log('3. Run: localStorage.getItem("accessToken")');
    console.log('4. Copy the token and run: node test-train-me-status.mjs YOUR_TOKEN\n');
    process.exit(1);
  }
  
  try {
    console.log(`📡 Calling ${API_URL}/api/train-me/status`);
    
    const response = await fetch(`${API_URL}/api/train-me/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ SUCCESS! Train Me status endpoint working correctly\n');
      console.log('Response data:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.active) {
        console.log(`\n🎉 Train Me is ACTIVE (source: ${data.source})`);
        console.log(`   Days remaining: ${data.daysRemaining}`);
        if (data.expiryDate) {
          console.log(`   Expires: ${new Date(data.expiryDate).toLocaleDateString()}`);
        }
      } else {
        console.log('\n⚠️  Train Me is NOT active');
        console.log('   User needs to purchase Train Me to access this feature');
      }
    } else {
      const errorText = await response.text();
      console.log('\n❌ FAILED! Endpoint returned error\n');
      console.log('Error response:');
      console.log(errorText);
      
      if (response.status === 500) {
        console.log('\n🔍 This is a 500 Internal Server Error');
        console.log('   Check server logs for detailed error information');
      } else if (response.status === 401) {
        console.log('\n🔍 This is a 401 Unauthorized error');
        console.log('   Your access token may be invalid or expired');
      }
    }
    
  } catch (error) {
    console.log('\n❌ FAILED! Network or connection error\n');
    console.error(error);
    console.log('\nMake sure:');
    console.log('1. The server is running (npm run dev)');
    console.log('2. The API URL is correct:', API_URL);
  }
}

testTrainMeStatus();
