#!/usr/bin/env node

/**
 * Verification script for deployment setup
 * This script checks if all required files are in place for production deployment
 */

import fs from 'fs';
import path from 'path';

const __dirname = import.meta.dirname;

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  return exists;
}

function main() {
  console.log('🔍 Verifying deployment setup...\n');
  
  let allGood = true;
  
  // Check if build files exist
  const distPublicPath = path.resolve(__dirname, 'dist', 'public');
  const distIndexJs = path.resolve(__dirname, 'dist', 'index.js');
  const serverPublicPath = path.resolve(__dirname, 'server', 'public');
  
  allGood &= checkFile(distPublicPath, 'Build output directory (dist/public)');
  allGood &= checkFile(path.join(distPublicPath, 'index.html'), 'Client HTML file');
  allGood &= checkFile(distIndexJs, 'Server bundle (dist/index.js)');
  allGood &= checkFile(serverPublicPath, 'Server public directory');
  allGood &= checkFile(path.join(serverPublicPath, 'index.html'), 'Server static HTML file');
  
  console.log('\n📊 File size comparison:');
  if (fs.existsSync(distPublicPath) && fs.existsSync(serverPublicPath)) {
    const distFiles = fs.readdirSync(distPublicPath);
    const serverFiles = fs.readdirSync(serverPublicPath);
    
    console.log(`   - dist/public: ${distFiles.length} files`);
    console.log(`   - server/public: ${serverFiles.length} files`);
    
    if (distFiles.length === serverFiles.length) {
      console.log('   ✅ File counts match');
    } else {
      console.log('   ⚠️  File counts differ - run deploy-setup.js again');
      allGood = false;
    }
  }
  
  console.log('\n📋 Summary:');
  if (allGood) {
    console.log('✅ Deployment verification PASSED');
    console.log('   Ready for production deployment!');
    console.log('\n🚀 To deploy:');
    console.log('   1. Ensure NODE_ENV=production');
    console.log('   2. Run: node dist/index.js');
  } else {
    console.log('❌ Deployment verification FAILED');
    console.log('\n🔧 To fix:');
    console.log('   1. Run: npm run build');
    console.log('   2. Run: node deploy-setup.js');
    console.log('   3. Run: node verify-deployment.js');
  }
}

main();