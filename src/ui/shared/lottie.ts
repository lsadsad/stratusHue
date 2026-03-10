// Lottie library is currently disabled for debugging; typed as unknown until re-enabled.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LottieAnimation = any;

interface LottieAnimationConfig {
  container: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animationData: any;
  renderer?: 'svg' | 'canvas' | 'html';
  loop?: boolean;
  autoplay?: boolean;
  name?: string;
}

// Store active Lottie animations for management
export const activeLottieAnimations = new Map<string, LottieAnimation>();

// Lottie Animation Utilities
export function initializeLottieAnimation(config: LottieAnimationConfig): LottieAnimation {
  try {
    // Temporarily disable lottie to debug
    console.log('Lottie animation disabled for debugging');
    const animation = null;
    /*
    const animation = lottie.loadAnimation({
      container: config.container,
      renderer: config.renderer || 'svg',
      loop: config.loop !== false, // Default to true
      autoplay: config.autoplay !== false, // Default to true
      animationData: config.animationData,
      name: config.name || `lottie-${Date.now()}`
    });
    */

    // Store animation for management
    if (config.name) {
      activeLottieAnimations.set(config.name, animation);
    }

    console.log('✨ Lottie animation initialized:', config.name || 'unnamed');
    return animation;
  } catch (error) {
    console.error('❌ Failed to initialize Lottie animation:', error);
    return null;
  }
}

export function loadLottieFromElement(element: HTMLElement): LottieAnimation {
  const lottieData = element.getAttribute('data-lottie');
  if (!lottieData) {
    console.warn('No Lottie data found on element');
    return null;
  }

  try {
    const animationData = JSON.parse(lottieData.replace(/&#39;/g, "'"));
    const animationName = element.getAttribute('data-lottie-name') || `lottie-${element.id || Date.now()}`;

    return initializeLottieAnimation({
      container: element,
      animationData,
      renderer: (element.getAttribute('data-lottie-renderer') as LottieAnimationConfig['renderer']) || 'svg',
      loop: element.getAttribute('data-lottie-loop') !== 'false',
      autoplay: element.getAttribute('data-lottie-autoplay') !== 'false',
      name: animationName
    });
  } catch (error) {
    console.error('❌ Failed to parse Lottie data:', error);
    return null;
  }
}

export function initializeAllLottieElements(): void {
  const lottieElements = document.querySelectorAll('[data-lottie]');
  console.log(`🎬 Found ${lottieElements.length} Lottie elements to initialize`);

  lottieElements.forEach((element) => {
    loadLottieFromElement(element as HTMLElement);
  });
}

export function destroyLottieAnimation(name: string): void {
  const animation = activeLottieAnimations.get(name);
  if (animation) {
    animation.destroy();
    activeLottieAnimations.delete(name);
    console.log('🗑️ Destroyed Lottie animation:', name);
  }
}

export function destroyAllLottieAnimations(): void {
  activeLottieAnimations.forEach((animation, name) => {
    animation.destroy();
    console.log('🗑️ Destroyed Lottie animation:', name);
  });
  activeLottieAnimations.clear();
}

export function playLottieAnimation(name: string): void {
  const animation = activeLottieAnimations.get(name);
  if (animation) {
    animation.play();
    console.log('▶️ Playing Lottie animation:', name);
  }
}

export function pauseLottieAnimation(name: string): void {
  const animation = activeLottieAnimations.get(name);
  if (animation) {
    animation.pause();
    console.log('⏸️ Paused Lottie animation:', name);
  }
}

export function stopLottieAnimation(name: string): void {
  const animation = activeLottieAnimations.get(name);
  if (animation) {
    animation.stop();
    console.log('⏹️ Stopped Lottie animation:', name);
  }
}
