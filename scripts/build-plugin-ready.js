import fs from 'fs';
import path from 'path';

// Clean plugin-ready directory
const outputDir = 'plugin-ready'; // Change this to 'stratusHue' if desired
if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
}
fs.mkdirSync(outputDir, { recursive: true });

// Recursively copy a directory
function copyDirectory(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) return;
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else if (entry.isFile()) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('🚀 Building plugin-ready distribution...');

// Copy essential plugin files
const filesToCopy = [
    { src: 'dist/code.js', dest: 'plugin-ready/code.js' },
    { src: 'dist/ui.html', dest: 'plugin-ready/ui.html' },
    { src: 'icon.svg', dest: 'plugin-ready/icon.svg' }
];

filesToCopy.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✅ Copied ${src} → ${dest}`);
    } else {
        console.warn(`⚠️  Source file not found: ${src}`);
    }
});

// Copy assets if they exist
if (fs.existsSync('dist/assets')) {
    copyDirectory('dist/assets', 'plugin-ready/assets');
    console.log('✅ Copied assets → plugin-ready/assets');
}

// Create production manifest (without source maps references)
const manifest = {
    "name": "stratusHue",
    "id": "1586934885538203561",
    "api": "1.0.0",
    "main": "code.js",
    "ui": "ui.html",
    "capabilities": [],
    "enableProposedApi": false,
    "editorType": ["figma", "figjam"],
    "documentAccess": "dynamic-page",
    "networkAccess": {
        "allowedDomains": ["none"]
    }
};

fs.writeFileSync('plugin-ready/manifest.json', JSON.stringify(manifest, null, 2));
console.log('✅ Created plugin-ready/manifest.json');

// Create a README for the plugin-ready folder
const pluginReadyReadme = `# stratusHue - Plugin Distribution

This folder contains the production-ready build of the stratusHue Figma plugin.

## Files

- \`manifest.json\` - Plugin configuration for Figma
- \`code.js\` - Main plugin logic (minified)
- \`ui.html\` - Plugin interface with inlined CSS/JS and assets
- \`icon.svg\` - Plugin icon
- \`assets/\` - Static assets used by the plugin

## Installation

To install this plugin in Figma:

1. Open Figma Desktop App
2. Go to Plugins → Development → Import plugin from manifest
3. Select the \`manifest.json\` file from this folder
4. The plugin will be available in your Plugins menu

## Distribution

This build is ready for:
- Figma Community submission
- Private distribution
- Development testing

All assets are inlined and optimized for production use.
`;

fs.writeFileSync('plugin-ready/README.md', pluginReadyReadme);
console.log('✅ Created plugin-ready/README.md');

// Get file sizes for info
const getFileSize = (filePath) => {
    if (fs.existsSync(filePath)) {
        return (fs.statSync(filePath).size / 1024).toFixed(1) + ' KB';
    }
    return 'N/A';
};

console.log('\n📊 Plugin-Ready Build Summary:');
console.log(`  code.js: ${getFileSize('plugin-ready/code.js')}`);
console.log(`  ui.html: ${getFileSize('plugin-ready/ui.html')}`);
console.log(`  manifest.json: ${getFileSize('plugin-ready/manifest.json')}`);
console.log(`  icon.svg: ${getFileSize('plugin-ready/icon.svg')}`);

console.log('\n🎉 Plugin-ready build completed successfully!');
console.log('📁 Files are ready in the plugin-ready/ folder');

// Auto-package if requested
if (process.env.AUTO_PACKAGE === 'true' || process.argv.includes('--package')) {
    console.log('\n📦 Auto-packaging plugin...');
    try {
        const { execSync } = await import('child_process');
        const outputDir = process.env.PLUGIN_OUTPUT_DIR || process.argv.find(arg => arg.startsWith('--output='))?.split('=')[1];
        const packageCmd = outputDir ? `node scripts/package-plugin.js "${outputDir}"` : 'node scripts/package-plugin.js';
        execSync(packageCmd, { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Auto-packaging failed:', error.message);
    }
}