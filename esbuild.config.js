import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

// Clean dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

function readUtf8OrNull(filePath) {
	try {
		return fs.readFileSync(filePath, 'utf8');
	} catch (error) {
		if (error && (error.code === 'ENOENT' || error.code === 'EBUSY')) {
			return null;
		}
		throw error;
	}
}

function inlineAssetDataUris(html) {
	if (!html) return html;
	
	// Handle regular src attributes for images
	html = html.replace(/src=["']\.?\/?assets\/([^"']+)["']/g, (match, relPath) => {
		const assetPath = path.join('assets', relPath);
		if (!fs.existsSync(assetPath)) return match;
		const ext = path.extname(assetPath).toLowerCase();
		let mime = '';
		if (ext === '.svg') mime = 'image/svg+xml';
		else if (ext === '.png') mime = 'image/png';
		else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
		else return match;
		try {
			const data = fs.readFileSync(assetPath);
			const base64 = data.toString('base64');
			return `src="data:${mime};base64,${base64}"`;
		} catch (_err) {
			return match;
		}
	});
	
	// Handle Lottie files with data-lottie-src attributes
	html = html.replace(/data-lottie-src=["']\.?\/?assets\/([^"']+\.json)["']/g, (match, relPath) => {
		const assetPath = path.join('assets', relPath);
		if (!fs.existsSync(assetPath)) return match;
		try {
			const jsonData = fs.readFileSync(assetPath, 'utf8');
			// Verify it's a valid Lottie file by checking for required properties
			const lottieData = JSON.parse(jsonData);
			if (lottieData.v && lottieData.layers) {
				return `data-lottie='${jsonData.replace(/'/g, "&#39;")}'`;
			}
		} catch (_err) {
			// If it's not a valid Lottie file, return original
		}
		return match;
	});
	
	return html;
}

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

function copyAssets() {
	const sourceDir = 'assets';
	const destinationDir = path.join('dist', 'assets');
	if (!fs.existsSync(sourceDir)) return;
	// Ensure destination exists and mirror contents
	fs.mkdirSync(destinationDir, { recursive: true });
	copyDirectory(sourceDir, destinationDir);
	console.log('📦 Copied assets → dist/assets');
}

async function build() {
  try {
    // Build plugin code (runs in Figma sandbox)
    await esbuild.build({
      entryPoints: ['src/code.ts'],
      bundle: true,
      outfile: 'dist/code.js',
      platform: 'neutral',
      target: 'es2017',
      format: 'cjs',
      external: [],
      minify: process.env.NODE_ENV === 'production',
      sourcemap: process.env.NODE_ENV !== 'production'
    });

    // Build UI code (runs in browser iframe) - ONLY if you have src/ui.ts
    if (fs.existsSync('src/ui.ts')) {
      await esbuild.build({
        entryPoints: ['src/ui.ts'],
        bundle: true,
        outfile: 'dist/ui.js',
        platform: 'browser',
        target: 'es2017',
        format: 'iife',
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production'
      });
    }

    // Process HTML and inline CSS/JS
    let htmlContent = fs.readFileSync('src/ui.html', 'utf8');

    // Inline CSS
    const cssContent = fs.readFileSync('src/styles.css', 'utf8');
    htmlContent = htmlContent.replace(
      /<link rel="stylesheet" href="styles\.css">/,
      `<style>${cssContent}</style>`
    );

    if (fs.existsSync('src/ui.ts')) {
      const jsBundlePath = 'dist/ui.js';
      if (fs.existsSync(jsBundlePath)) {
        const jsContent = fs.readFileSync(jsBundlePath, 'utf8');
        // Escape $ characters to prevent special replacement patterns ($&, $`, $', $1, etc.)
        const escapedJsContent = jsContent.replace(/\$/g, '$$$$');
        // Inline JS: replace an external script tag or any inline script, or append before </body>
        if (/<script\s+src=\"ui\.js\"\s*><\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script\s+src=\"ui\.js\"\s*><\/script>/, `<script>${escapedJsContent}<\/script>`);
        } else if (/<script>[\s\S]*<\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script>[\s\S]*<\/script>/, `<script>${escapedJsContent}<\/script>`);
        } else {
          htmlContent = htmlContent.replace('</body>', `<script>${escapedJsContent}<\/script>\n</body>`);
        }
      }
    }
    // Inline asset references so they work in Figma's sandbox
    htmlContent = inlineAssetDataUris(htmlContent);
    fs.writeFileSync('dist/ui.html', htmlContent);

    // Copy static assets used by the UI
    copyAssets();

    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Watch mode for development
if (process.argv.includes('--watch')) {
  console.log('👀 Watching for changes...');

  // Watch plugin code
  const pluginContext = await esbuild.context({
    entryPoints: ['src/code.ts'],
    bundle: true,
    outfile: 'dist/code.js',
    platform: 'neutral',
    target: 'es2017',
    format: 'cjs',
    sourcemap: true
  });
  await pluginContext.watch();

  // Watch UI code if it exists
  if (fs.existsSync('src/ui.ts')) {
    const uiContext = await esbuild.context({
      entryPoints: ['src/ui.ts'],
      bundle: true,
      outfile: 'dist/ui.js',
      platform: 'browser',
      target: 'es2017',
      format: 'iife',
      sourcemap: true
    });
    await uiContext.watch();
  }

	// Initial copy of assets and watch for changes
	copyAssets();
	if (fs.existsSync('assets')) {
		try {
			fs.watch('assets', { recursive: true }, () => {
				copyAssets();
				// Re-inline assets into HTML
				let htmlContent = readUtf8OrNull('src/ui.html');
				if (!htmlContent) return;
				const cssContent = readUtf8OrNull('src/styles.css') ?? '';
				htmlContent = htmlContent.replace(
					/<link rel="stylesheet" href="styles\.css">/,
					`<style>${cssContent}</style>`
				);
				const jsBundlePath = 'dist/ui.js';
				if (fs.existsSync(jsBundlePath)) {
					const jsContent = readUtf8OrNull(jsBundlePath);
					if (jsContent) {
						const escapedJsContent = jsContent.replace(/\$/g, '$$$$');
						if (/<script\s+src=\"ui\.js\"\s*><\/script>/.test(htmlContent)) {
							htmlContent = htmlContent.replace(/<script\s+src=\"ui\.js\"\s*><\/script>/, `<script>${escapedJsContent}<\/script>`);
						} else if (/<script>[\s\S]*<\/script>/.test(htmlContent)) {
							htmlContent = htmlContent.replace(/<script>[\s\S]*<\/script>/, `<script>${escapedJsContent}<\/script>`);
						} else {
							htmlContent = htmlContent.replace('</body>', `<script>${escapedJsContent}<\/script>\n</body>`);
						}
					}
				}
				htmlContent = inlineAssetDataUris(htmlContent);
				fs.writeFileSync('dist/ui.html', htmlContent);
				console.log('✅ Assets updated');
			});
		} catch (_err) {
			// Fallback for environments without recursive watch support
			fs.watch('assets', () => {
				copyAssets();
				let htmlContent = readUtf8OrNull('src/ui.html');
				if (!htmlContent) return;
				const cssContent = readUtf8OrNull('src/styles.css') ?? '';
				htmlContent = htmlContent.replace(
					/<link rel="stylesheet" href="styles\.css">/,
					`<style>${cssContent}</style>`
				);
				const jsBundlePath = 'dist/ui.js';
				if (fs.existsSync(jsBundlePath)) {
					const jsContent = readUtf8OrNull(jsBundlePath);
					if (jsContent) {
						const escapedJsContent = jsContent.replace(/\$/g, '$$$$');
						if (/<script\s+src=\"ui\.js\"\s*><\/script>/.test(htmlContent)) {
							htmlContent = htmlContent.replace(/<script\s+src=\"ui\.js\"\s*><\/script>/, `<script>${escapedJsContent}<\/script>`);
						} else if (/<script>[\s\S]*<\/script>/.test(htmlContent)) {
							htmlContent = htmlContent.replace(/<script>[\s\S]*<\/script>/, `<script>${escapedJsContent}<\/script>`);
						} else {
							htmlContent = htmlContent.replace('</body>', `<script>${escapedJsContent}<\/script>\n</body>`);
						}
					}
				}
				htmlContent = inlineAssetDataUris(htmlContent);
				fs.writeFileSync('dist/ui.html', htmlContent);
				console.log('✅ Assets updated');
			});
		}
	}

  // Watch CSS and HTML files
  fs.watchFile('src/styles.css', () => {
    // Rebuild HTML with inlined CSS
    const htmlRead = readUtf8OrNull('src/ui.html');
    if (!htmlRead) return;
    let htmlContent = htmlRead;
    const cssContent = readUtf8OrNull('src/styles.css') ?? '';
    htmlContent = htmlContent.replace(
      /<link rel="stylesheet" href="styles\.css">/,
      `<style>${cssContent}</style>`
    );
    if (fs.existsSync('src/ui.ts')) {
      const jsBundlePath = 'dist/ui.js';
      if (fs.existsSync(jsBundlePath)) {
        const jsContent = readUtf8OrNull(jsBundlePath);
        if (!jsContent) return;
        const escapedJsContent = jsContent.replace(/\$/g, '$$$$');
        if (/<script\s+src=\"ui\.js\"\s*><\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script\s+src=\"ui\.js\"\s*><\/script>/, `<script>${escapedJsContent}<\/script>`);
        } else if (/<script>[\s\S]*<\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script>[\s\S]*<\/script>/, `<script>${escapedJsContent}<\/script>`);
        } else {
          htmlContent = htmlContent.replace('</body>', `<script>${escapedJsContent}<\/script>\n</body>`);
        }
      }
    }
    htmlContent = inlineAssetDataUris(htmlContent);
    fs.writeFileSync('dist/ui.html', htmlContent);
    console.log('✅ CSS updated and inlined');
  });

  fs.watchFile('src/ui.html', () => {
    const htmlRead = readUtf8OrNull('src/ui.html');
    if (!htmlRead) return;
    let htmlContent = htmlRead;
    const cssContent = readUtf8OrNull('src/styles.css') ?? '';
    htmlContent = htmlContent.replace(
      /<link rel="stylesheet" href="styles\.css">/,
      `<style>${cssContent}</style>`
    );
    if (fs.existsSync('src/ui.ts')) {
      const jsBundlePath = 'dist/ui.js';
      if (fs.existsSync(jsBundlePath)) {
        const jsContent = readUtf8OrNull(jsBundlePath);
        if (!jsContent) return;
        const escapedJsContent = jsContent.replace(/\$/g, '$$$$');
        if (/<script\s+src=\"ui\.js\"\s*><\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script\s+src=\"ui\.js\"\s*><\/script>/, `<script>${escapedJsContent}<\/script>`);
        } else if (/<script>[\s\S]*<\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script>[\s\S]*<\/script>/, `<script>${escapedJsContent}<\/script>`);
        } else {
          htmlContent = htmlContent.replace('</body>', `<script>${escapedJsContent}<\/script>\n</body>`);
        }
      }
    }
    htmlContent = inlineAssetDataUris(htmlContent);
    fs.writeFileSync('dist/ui.html', htmlContent);
    console.log('✅ HTML updated with inlined CSS');
  });

  // Watch built UI JS to re-inline into HTML
  fs.watchFile('dist/ui.js', () => {
    const htmlRead = readUtf8OrNull('src/ui.html');
    if (!htmlRead) return;
    let htmlContent = htmlRead;
    const cssContent = readUtf8OrNull('src/styles.css') ?? '';
    htmlContent = htmlContent.replace(
      /<link rel="stylesheet" href="styles\.css">/,
      `<style>${cssContent}</style>`
    );
    const jsContent = readUtf8OrNull('dist/ui.js');
    if (!jsContent) return;
    const escapedJsContent = jsContent.replace(/\$/g, '$$$$');
    if (/<script\s+src=\"ui\.js\"\s*><\/script>/.test(htmlContent)) {
      htmlContent = htmlContent.replace(/<script\s+src=\"ui\.js\"\s*><\/script>/, `<script>${escapedJsContent}<\/script>`);
    } else if (/<script>[\s\S]*<\/script>/.test(htmlContent)) {
      htmlContent = htmlContent.replace(/<script>[\s\S]*<\/script>/, `<script>${escapedJsContent}<\/script>`);
    } else {
      htmlContent = htmlContent.replace('</body>', `<script>${escapedJsContent}<\/script>\n</body>`);
    }
    htmlContent = inlineAssetDataUris(htmlContent);
    fs.writeFileSync('dist/ui.html', htmlContent);
    console.log('✅ UI JS updated and inlined');
  });
} else {
  build();
}