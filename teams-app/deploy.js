#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('ServiceNow Sales Assistant - Teams App Deployment Helper\n');

// Get the current Replit app URL
let replitUrl = process.env.REPLIT_URL || 'workspace.replit.app';
// Strip any protocol prefix if present
replitUrl = replitUrl.replace(/^https?:\/\//, '');

console.log(`📱 Building Teams app package for: ${replitUrl}`);

// Read manifest template
const manifestPath = path.join(__dirname, 'manifest.json');
let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Replace placeholder URLs
manifest = JSON.stringify(manifest).replace(/{baseUrl}/g, replitUrl);
manifest = JSON.parse(manifest);

// Create dist directory if it doesn't exist
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath);
}

// Write updated manifest to dist folder
const distManifestPath = path.join(distPath, 'manifest.json');
fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2));

// Copy icons to dist folder
fs.copyFileSync(path.join(__dirname, 'color-icon.png'), path.join(distPath, 'color-icon.png'));
fs.copyFileSync(path.join(__dirname, 'outline-icon.png'), path.join(distPath, 'outline-icon.png'));

console.log('Teams app package built successfully!');
console.log('\n Installation Files Ready in "dist" folder!');
console.log('\nNext steps:');
console.log('1. Download these 3 files from the "dist" folder:');
console.log('   - dist/manifest.json');
console.log('   - dist/color-icon.png');
console.log('   - dist/outline-icon.png');
console.log('\n2. In Microsoft Teams:');
console.log('   - Apps → Manage your apps → Upload a custom app → Upload for me');
console.log('   - Select all 3 files from the "dist" folder');
console.log('   - Click Add');
console.log('\n🔒 Your app will be private - only visible to you!');