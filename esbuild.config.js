import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

// Clean dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

async function build() {
  try {
    // Build plugin code (runs in Figma sandbox)
    await esbuild.build({
      entryPoints: ['src/code.ts'],
      bundle: true,
      outfile: 'dist/code.js',
      platform: 'node',
      target: 'es2017',
      format: 'cjs',
      external: [], // Include all dependencies
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
        // Inline JS: replace an external script tag or any inline script, or append before </body>
        if (/<script\s+src=\"ui\.js\"\s*><\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script\s+src=\"ui\.js\"\s*><\/script>/, `<script>${jsContent}<\/script>`);
        } else if (/<script>[\s\S]*<\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script>[\s\S]*<\/script>/, `<script>${jsContent}<\/script>`);
        } else {
          htmlContent = htmlContent.replace('</body>', `<script>${jsContent}<\/script>\n</body>`);
        }
      }
    }
    fs.writeFileSync('dist/ui.html', htmlContent);

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
    platform: 'node',
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

  // Watch CSS and HTML files
  fs.watchFile('src/styles.css', () => {
    // Rebuild HTML with inlined CSS
    let htmlContent = fs.readFileSync('src/ui.html', 'utf8');
    const cssContent = fs.readFileSync('src/styles.css', 'utf8');
    htmlContent = htmlContent.replace(
      /<link rel="stylesheet" href="styles\.css">/,
      `<style>${cssContent}</style>`
    );
    if (fs.existsSync('src/ui.ts')) {
      const jsBundlePath = 'dist/ui.js';
      if (fs.existsSync(jsBundlePath)) {
        const jsContent = fs.readFileSync(jsBundlePath, 'utf8');
        if (/<script\s+src=\"ui\.js\"\s*><\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script\s+src=\"ui\.js\"\s*><\/script>/, `<script>${jsContent}<\/script>`);
        } else if (/<script>[\s\S]*<\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script>[\s\S]*<\/script>/, `<script>${jsContent}<\/script>`);
        } else {
          htmlContent = htmlContent.replace('</body>', `<script>${jsContent}<\/script>\n</body>`);
        }
      }
    }
    fs.writeFileSync('dist/ui.html', htmlContent);
    console.log('✅ CSS updated and inlined');
  });

  fs.watchFile('src/ui.html', () => {
    let htmlContent = fs.readFileSync('src/ui.html', 'utf8');
    const cssContent = fs.readFileSync('src/styles.css', 'utf8');
    htmlContent = htmlContent.replace(
      /<link rel="stylesheet" href="styles\.css">/,
      `<style>${cssContent}</style>`
    );
    if (fs.existsSync('src/ui.ts')) {
      const jsBundlePath = 'dist/ui.js';
      if (fs.existsSync(jsBundlePath)) {
        const jsContent = fs.readFileSync(jsBundlePath, 'utf8');
        if (/<script\s+src=\"ui\.js\"\s*><\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script\s+src=\"ui\.js\"\s*><\/script>/, `<script>${jsContent}<\/script>`);
        } else if (/<script>[\s\S]*<\/script>/.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<script>[\s\S]*<\/script>/, `<script>${jsContent}<\/script>`);
        } else {
          htmlContent = htmlContent.replace('</body>', `<script>${jsContent}<\/script>\n</body>`);
        }
      }
    }
    fs.writeFileSync('dist/ui.html', htmlContent);
    console.log('✅ HTML updated with inlined CSS');
  });

  // Watch built UI JS to re-inline into HTML
  fs.watchFile('dist/ui.js', () => {
    let htmlContent = fs.readFileSync('src/ui.html', 'utf8');
    const cssContent = fs.readFileSync('src/styles.css', 'utf8');
    htmlContent = htmlContent.replace(
      /<link rel="stylesheet" href="styles\.css">/,
      `<style>${cssContent}</style>`
    );
    const jsContent = fs.readFileSync('dist/ui.js', 'utf8');
    if (/<script\s+src=\"ui\.js\"\s*><\/script>/.test(htmlContent)) {
      htmlContent = htmlContent.replace(/<script\s+src=\"ui\.js\"\s*><\/script>/, `<script>${jsContent}<\/script>`);
    } else if (/<script>[\s\S]*<\/script>/.test(htmlContent)) {
      htmlContent = htmlContent.replace(/<script>[\s\S]*<\/script>/, `<script>${jsContent}<\/script>`);
    } else {
      htmlContent = htmlContent.replace('</body>', `<script>${jsContent}<\/script>\n</body>`);
    }
    fs.writeFileSync('dist/ui.html', htmlContent);
    console.log('✅ UI JS updated and inlined');
  });
} else {
  build();
}