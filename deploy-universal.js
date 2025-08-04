#!/usr/bin/env node

/**
 * Universal deployment setup script
 * Handles deployment for various platforms by creating build files in multiple expected locations
 */

import fs from 'fs';
import path from 'path';

const __dirname = import.meta.dirname;

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function createSymlinkSafe(target, linkPath) {
  try {
    if (fs.existsSync(linkPath)) {
      const stats = fs.lstatSync(linkPath);
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(linkPath);
      } else if (stats.isDirectory()) {
        fs.rmSync(linkPath, { recursive: true });
      }
    }
    
    const linkDir = path.dirname(linkPath);
    if (!fs.existsSync(linkDir)) {
      fs.mkdirSync(linkDir, { recursive: true });
    }
    
    fs.symlinkSync(target, linkPath, 'dir');
    console.log(`✅ Created symlink: ${linkPath} -> ${target}`);
    return true;
  } catch (error) {
    console.log(`⚠️  Symlink failed, will use copy: ${error.message}`);
    return false;
  }
}

function main() {
  const distPublicPath = path.resolve(__dirname, 'dist', 'public');
  
  console.log('🚀 Universal deployment setup starting...');
  console.log('Current working directory:', process.cwd());
  console.log('Script directory:', __dirname);
  
  if (!fs.existsSync(distPublicPath)) {
    console.error('❌ Build directory not found at', distPublicPath);
    console.error('Please run "npm run build" first');
    process.exit(1);
  }
  
  // List of all possible locations where deployment platforms might look
  const deploymentPaths = [
    path.resolve(__dirname, 'server', 'public'),           // Our server expects this
    path.resolve(__dirname, 'client', 'dist'),             // Some platforms expect this
    path.resolve(__dirname, 'public'),                     // Root public directory
    path.resolve(__dirname, 'build'),                      // Alternative build directory
  ];
  
  console.log('📁 Creating build files in all expected locations:');
  
  for (const targetPath of deploymentPaths) {
    console.log(`\n📂 Setting up: ${targetPath}`);
    
    // Try to create symlink first (faster and uses less space)
    const symlinkSuccess = createSymlinkSafe(distPublicPath, targetPath);
    
    if (!symlinkSuccess) {
      // Fall back to copying files
      console.log(`📋 Copying files to: ${targetPath}`);
      copyDir(distPublicPath, targetPath);
      console.log(`✅ Files copied to: ${targetPath}`);
    }
  }
  
  // Verify all paths exist
  console.log('\n🔍 Verification:');
  let allGood = true;
  
  for (const targetPath of deploymentPaths) {
    const exists = fs.existsSync(targetPath);
    const hasIndex = exists && fs.existsSync(path.join(targetPath, 'index.html'));
    console.log(`${hasIndex ? '✅' : '❌'} ${targetPath} ${hasIndex ? '(has index.html)' : '(missing or no index.html)'}`);
    if (!hasIndex) allGood = false;
  }
  
  if (allGood) {
    console.log('\n🎉 Universal deployment setup complete!');
    console.log('Production server should work on any deployment platform.');
  } else {
    console.log('\n⚠️  Some paths were not set up correctly. Check the errors above.');
  }
}

main();