#!/usr/bin/env node

/**
 * Deployment setup script
 * This script ensures the built client files are in the correct location for production serving
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

function main() {
  const distPublicPath = path.resolve(__dirname, 'dist', 'public');
  const serverPublicPath = path.resolve(__dirname, 'server', 'public');
  
  // Additional paths for different deployment environments
  const clientDistPath = path.resolve(__dirname, 'client', 'dist');
  
  console.log('Setting up deployment files...');
  console.log('Current working directory:', process.cwd());
  console.log('Script directory:', __dirname);
  
  if (!fs.existsSync(distPublicPath)) {
    console.error('Error: Build directory not found at', distPublicPath);
    console.error('Please run "npm run build" first');
    process.exit(1);
  }
  
  console.log('Copying client build files to server/public...');
  copyDir(distPublicPath, serverPublicPath);
  
  // Also create client/dist directory and copy files there for deployment platforms that expect it
  console.log('Creating client/dist directory for deployment compatibility...');
  copyDir(distPublicPath, clientDistPath);
  
  console.log('Deployment setup complete!');
  console.log('Production server can find static files at:', serverPublicPath);
  console.log('Deployment platforms can find files at:', clientDistPath);
}

main();