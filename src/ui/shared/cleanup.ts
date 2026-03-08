import { activeLottieAnimations } from './lottie';
import { updateScrollBehavior } from './layout';

// Timer management for cleanup
export const activeTimers = new Set<ReturnType<typeof setTimeout>>();
const originalSetTimeout = window.setTimeout;
const originalSetInterval = window.setInterval;

// Override setTimeout to track timers
(window as any).setTimeout = function (callback: TimerHandler, delay?: number, ...args: any[]): ReturnType<typeof setTimeout> {
  const timerId = originalSetTimeout.call(window, (...callbackArgs: any[]) => {
    activeTimers.delete(timerId);
    if (typeof callback === 'function') {
      callback.apply(this, callbackArgs);
    }
  }, delay || 0);
  activeTimers.add(timerId);
  return timerId;
};

// Override setInterval to track timers
(window as any).setInterval = function (callback: TimerHandler, delay?: number, ...args: any[]): ReturnType<typeof setInterval> {
  const timerId = originalSetInterval.call(window, (...callbackArgs: any[]) => {
    if (typeof callback === 'function') {
      callback.apply(this, callbackArgs);
    }
  }, delay || 0);
  activeTimers.add(timerId);
  return timerId;
};

export function clearAllTimers(): void {
  activeTimers.forEach(timerId => {
    clearTimeout(timerId);
    clearInterval(timerId);
  });
  activeTimers.clear();
}

// Event listener management
// DISABLED: Overriding EventTarget.prototype can interfere with Figma's internal event handling
// This was causing styleq errors in Figma's UI framework
export const activeEventListeners = new Map<EventTarget, Array<{
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
}>>();

/* COMMENTED OUT TO AVOID CONFLICTS WITH FIGMA'S EVENT HANDLING
const originalAddEventListener = EventTarget.prototype.addEventListener;
const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

// Override addEventListener to track listeners
EventTarget.prototype.addEventListener = function (
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions
) {
  if (!activeEventListeners.has(this)) {
    activeEventListeners.set(this, []);
  }
  activeEventListeners.get(this)!.push({ type, listener, options });
  return originalAddEventListener.call(this, type, listener, options);
};

// Override removeEventListener to untrack listeners
EventTarget.prototype.removeEventListener = function (
  type: string,
  listener: EventListener,
  options?: boolean | EventListenerOptions
) {
  const listeners = activeEventListeners.get(this);
  if (listeners) {
    const index = listeners.findIndex(l => l.type === type && l.listener === listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
  return originalRemoveEventListener.call(this, type, listener, options);
};
*/

export function removeAllEventListeners(): void {
  // Since we're not tracking listeners anymore, this is a no-op
  // Keep function for backward compatibility
  console.log('Event listener cleanup skipped (prototype override disabled)');
  /* ORIGINAL CODE COMMENTED OUT
  activeEventListeners.forEach((listeners, target) => {
    listeners.forEach(({ type, listener, options }) => {
      try {
        originalRemoveEventListener.call(target, type, listener, options);
      } catch (error) {
        console.warn('Error removing event listener:', error);
      }
    });
  });
  activeEventListeners.clear();
  */
}

// Performance optimization: pause/resume operations
export let nonEssentialOperationsPaused = false;

export function pauseNonEssentialOperations(): void {
  if (nonEssentialOperationsPaused) return;

  nonEssentialOperationsPaused = true;
  console.log('⏸️ Pausing non-essential operations (tab hidden)');

  // Pause Lottie animations
  activeLottieAnimations.forEach((animation) => {
    if (animation.isPaused === false) {
      animation.pause();
    }
  });

  // Reduce update frequency for scroll behavior
  const scrollUpdateInterval = setInterval(updateScrollBehavior, 1000); // Reduce to 1s
  activeTimers.add(scrollUpdateInterval);
}

export function resumeNonEssentialOperations(): void {
  if (!nonEssentialOperationsPaused) return;

  nonEssentialOperationsPaused = false;
  console.log('▶️ Resuming non-essential operations (tab visible)');

  // Resume Lottie animations
  activeLottieAnimations.forEach((animation) => {
    if (animation.isPaused === true) {
      animation.play();
    }
  });

  // Restore normal update frequency
  updateScrollBehavior();
}
