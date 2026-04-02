# Lottie Animation Support

> **Status: DORMANT** — The Lottie infrastructure is installed and ready but **not wired into active UI code**. The `lottie.loadAnimation()` call in `src/ui/shared/lottie.ts` is commented out, no HTML templates use `data-lottie-src`, and no modules import the Lottie helpers. See the "Re-enabling" section below for activation steps.

This document explains how to use Lottie animations in the Figma plugin once enabled.

## What's Been Added

### 1. Dependencies
- Added `lottie-web` package for rendering Lottie animations

### 2. Build System Updates
- Modified `esbuild.config.js` to automatically inline Lottie JSON files
- Added support for `data-lottie-src` attributes in HTML
- Lottie JSON files are validated and inlined as `data-lottie` attributes

### 3. JavaScript Utilities
- Added comprehensive Lottie animation management functions
- Automatic initialization of Lottie animations on page load
- Animation control functions (play, pause, stop, destroy)

## How to Use Lottie Animations

### Basic Usage

1. **Add your Lottie JSON file** to the `assets/` directory:
   ```
   assets/
   ├── my-animation.json
   └── loading-spinner.json
   ```

2. **Reference in HTML** using the `data-lottie-src` attribute:
   ```html
   <div class="my-animation" 
        data-lottie-src="./assets/my-animation.json" 
        data-lottie-name="my-animation"
        style="width: 100px; height: 100px;">
   </div>
   ```

3. **Build your project** - the Lottie JSON will be automatically inlined:
   ```bash
   npm run build
   ```

### Configuration Options

You can control Lottie animations using data attributes:

| Attribute | Description | Default | Options |
|-----------|-------------|---------|---------|
| `data-lottie-src` | Path to Lottie JSON file | Required | `./assets/animation.json` |
| `data-lottie-name` | Unique name for the animation | Auto-generated | Any string |
| `data-lottie-renderer` | Rendering method | `svg` | `svg`, `canvas`, `html` |
| `data-lottie-loop` | Whether to loop the animation | `true` | `true`, `false` |
| `data-lottie-autoplay` | Whether to start automatically | `true` | `true`, `false` |

### Example HTML

```html
<!-- Basic spinning loader -->
<div class="loader" 
     data-lottie-src="./assets/loading.json" 
     data-lottie-name="loader"
     style="width: 32px; height: 32px;">
</div>

<!-- Icon with hover control -->
<div class="icon-animation" 
     data-lottie-src="./assets/heart-icon.json" 
     data-lottie-name="heart-icon"
     data-lottie-loop="false"
     data-lottie-autoplay="false"
     style="width: 24px; height: 24px;">
</div>
```

### JavaScript Control

The build system includes utility functions for controlling animations:

```javascript
// Play an animation
playLottieAnimation('my-animation');

// Pause an animation
pauseLottieAnimation('my-animation');

// Stop an animation
stopLottieAnimation('my-animation');

// Destroy an animation (cleanup)
destroyLottieAnimation('my-animation');

// Initialize a new animation programmatically
initializeLottieAnimation({
  container: document.getElementById('my-container'),
  animationData: myLottieJSON,
  renderer: 'svg',
  loop: true,
  autoplay: true,
  name: 'dynamic-animation'
});
```

## Build Process

When you run `npm run build`, the build system:

1. **Scans HTML** for `data-lottie-src` attributes
2. **Validates JSON** files to ensure they're valid Lottie animations
3. **Inlines the JSON** data as `data-lottie` attributes
4. **Bundles lottie-web** library with your UI code
5. **Auto-initializes** all Lottie animations when the page loads

## Performance Notes

- Lottie animations are inlined into the HTML, so they work in Figma's sandboxed environment
- SVG renderer is recommended for icons and simple animations
- Canvas renderer is better for complex animations with many elements
- All animations are automatically managed to prevent memory leaks

## Troubleshooting

### Animation Not Loading
- Check that the JSON file exists in the `assets/` directory
- Verify the JSON file is a valid Lottie animation (has `v` and `layers` properties)
- Check browser console for error messages

### Animation Not Playing
- Ensure `data-lottie-autoplay="true"` is set (default)
- Check if the animation has a duration (`op` property in JSON)
- Verify the container has dimensions (width and height)

### Performance Issues
- Use SVG renderer for simple animations
- Avoid too many simultaneous animations
- Consider reducing animation complexity or frame rate

## Example Test Animation

The build includes a sample loading animation at `assets/sample-loading.json` that demonstrates a rotating circle.

## Re-enabling Lottie

To activate Lottie in the plugin:

1. **Uncomment** `lottie.loadAnimation()` in `src/ui/shared/lottie.ts`
2. **Import** `initializeAllLottieElements` in `navigate-ui.ts` (or the relevant mode UI) and call it during init
3. **Import** `destroyAllLottieAnimations` in `ui.ts` cleanup handler
4. **Add** `data-lottie-src="./assets/your-animation.json"` to HTML elements
5. **Optionally** re-add Lottie pause/resume in `cleanup.ts` visibility handlers
6. Run `npm run build` — the build system inlines JSON automatically

## Migration from Other Animation Libraries

If you're migrating from other animation libraries:
- Export your animations as Lottie JSON from After Effects (with Bodymovin plugin)
- Use online converters for SVG-to-Lottie conversion
- Test animations in the Lottie preview tools before integration