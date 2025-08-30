import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const packageName = 'stratus-hue-plugin';
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const zipName = `${packageName}-v${version}.zip`;

console.log('📦 Packaging plugin for distribution...');

// Ensure plugin-ready exists
if (!fs.existsSync('plugin-ready')) {
  console.log('⚠️  plugin-ready folder not found. Running build first...');
  execSync('npm run build:plugin-ready', { stdio: 'inherit' });
}

// Create packages directory if it doesn't exist
if (!fs.existsSync('packages')) {
  fs.mkdirSync('packages');
}

try {
  // Use PowerShell to create zip on Windows
  const command = `Compress-Archive -Path "plugin-ready\\*" -DestinationPath "packages\\${zipName}" -Force`;
  execSync(`powershell -Command "${command}"`, { stdio: 'inherit' });
  
  console.log(`✅ Plugin packaged successfully!`);
  console.log(`📁 Package location: packages/${zipName}`);
  
  // Get package size
  const stats = fs.statSync(`packages/${zipName}`);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`📊 Package size: ${sizeKB} KB`);
  
} catch (error) {
  console.error('❌ Failed to create package:', error.message);
  process.exit(1);
}