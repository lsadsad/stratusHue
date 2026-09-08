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

	// Inline SVG assets — replace <img src="*.svg"> with raw <svg> markup so
	// CSS currentColor and animations work without sandboxing restrictions.
	// Class attributes from the original <img> are merged into the <svg> root.
	// SVG content is collapsed to a single line so it is safe when injected
	// inside JS string literals (e.g. template-literal innerHTML assignments).
	html = html.replace(/<img\s[^>]*\bsrc=["']\.?\/?assets\/([^"']+\.svg)["'][^>]*>/g, (match, relPath) => {
		const assetPath = path.join('assets', relPath);
		if (!fs.existsSync(assetPath)) return match;
		try {
			let svgContent = fs.readFileSync(assetPath, 'utf8')
				.replace(/<\?xml[^>]*\?>\s*/g, '')   // strip XML prolog
				.replace(/<!--[\s\S]*?-->/g, '')      // strip comments (license headers etc.)
				.replace(/\s+/g, ' ')                 // collapse all whitespace / newlines
				.trim();
			// Carry over class attribute from <img> into <svg> root element
			const classMatch = match.match(/\bclass=["']([^"']*)["']/);
			if (classMatch) {
				const imgClass = classMatch[1];
				if (/^<svg[^>]*\bclass=["']/.test(svgContent)) {
					svgContent = svgContent.replace(/(<svg[^>]*\bclass=["'])([^"']*)["']/, `$1$2 ${imgClass}"`);
				} else {
					svgContent = svgContent.replace(/^<svg /, `<svg class="${imgClass}" `);
				}
			}
			return svgContent;
		} catch (_err) {
			return match;
		}
	});

	// Handle remaining src attributes for raster images (SVGs already inlined above)
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

// Build-time flags. STRATUSHUE_BRIDGE=1 produces the team flavor (bridge
// compiled in); anything else produces the community flavor, from which esbuild
// drops every bridge module via dead-code elimination.
//
// Deliberately NOT keyed off NODE_ENV: the team package is itself a minified
// production build, so a NODE_ENV-based flag would strip the bridge from exactly
// the build that needs it.
const bridgeEnabled = process.env.STRATUSHUE_BRIDGE === '1';
const BUILD_DEFINES = {
  __BRIDGE__: JSON.stringify(bridgeEnabled)
};

// Community-flavor guarantee: no bridge bytes survive.
//
// The compile-out relies on every bridge reference sitting behind an
// `if (__BRIDGE__)` guard. A single missed guard would silently ship bridge code
// — including the EXECUTE_CODE escape hatch — into the AT&T-approved / Community
// artifact. This turns that from a review question into a build failure.
const BRIDGE_MARKERS = [
  'bridge-cmd-',
  'BRIDGE_RESPONSE',
  'figma-console-mcp',
  'new WebSocket',
  'bridge-settings-section'
];

function assertNoBridgeInCommunityBuild() {
  const found = [];
  for (const file of ['dist/code.js', 'dist/ui.html']) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const marker of BRIDGE_MARKERS) {
      if (content.includes(marker)) found.push(`${file}: ${marker}`);
    }
  }
  if (found.length) {
    console.error('\n❌ Community build contains bridge code — a __BRIDGE__ guard is missing:');
    for (const f of found) console.error(`   ${f}`);
    console.error('\n   Every bridge reference must sit behind `if (__BRIDGE__)` so esbuild can');
    console.error('   drop it. Build the team flavor with STRATUSHUE_BRIDGE=1 instead.\n');
    process.exit(1);
  }
  console.log('✅ Community build verified: no bridge code present');
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
      sourcemap: process.env.NODE_ENV !== 'production',
      define: BUILD_DEFINES
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
        // Inline source maps: relative URLs can't be fetched inside Figma's iframe CSP
        sourcemap: process.env.NODE_ENV !== 'production' ? 'inline' : false,
        define: BUILD_DEFINES
      });
    }

    // Process HTML and inline CSS/JS
    let htmlContent = fs.readFileSync('src/ui.html', 'utf8');

    // Community flavor: strip bridge markup. JS dead-code elimination handles the
    // modules, but it cannot touch HTML — without this the settings row and the
    // footer status dots would still ship, giving a control with nothing behind it.
    if (!bridgeEnabled) {
      htmlContent = htmlContent.replace(/<!-- BRIDGE:START -->[\s\S]*?<!-- BRIDGE:END -->/g, '');
    }

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

    if (!bridgeEnabled) assertNoBridgeInCommunityBuild();

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