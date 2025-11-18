import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const packageName = 'stratushue-plugin';
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const zipName = `${packageName}-v${version}.zip`;

// Allow custom output directory via command line argument or environment variable
const customOutputDir = process.argv[2] || process.env.PLUGIN_OUTPUT_DIR;
const outputDir = customOutputDir || 'packages';

console.log('📦 Packaging plugin for distribution...');
console.log(`📁 Output directory: ${outputDir}`);

// Ensure plugin-ready exists
if (!fs.existsSync('plugin-ready')) {
  console.log('⚠️  plugin-ready folder not found. Running build first...');
  execSync('npm run build:plugin-ready', { stdio: 'inherit' });
}

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

try {
  const zipPath = path.join(outputDir, zipName);
  
  // Cross-platform zip creation
  const isWindows = process.platform === 'win32';
  let command;
  
  if (isWindows) {
    // Use PowerShell on Windows
    command = `powershell -Command "Compress-Archive -Path 'plugin-ready\\*' -DestinationPath '${zipPath}' -Force"`;
  } else {
    // Use zip command on macOS/Linux
    command = `cd plugin-ready && zip -r "../${zipPath}" . && cd ..`;
  }
  
  execSync(command, { stdio: 'inherit' });
  
  console.log(`✅ Plugin packaged successfully!`);
  console.log(`📁 Package location: ${zipPath}`);
  
  // Get package size
  const stats = fs.statSync(zipPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`📊 Package size: ${sizeKB} KB`);
  
} catch (error) {
  console.error('❌ Failed to create package:', error.message);
  process.exit(1);
}