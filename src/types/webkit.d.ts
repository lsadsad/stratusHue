// Type declarations for webkit-specific DOM methods
// This fixes TypeScript errors related to webkit fullscreen methods

interface Document {
  webkitCancelFullScreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
}

interface HTMLElement {
  webkitRequestFullScreen?: (options?: FullscreenOptions) => Promise<void>;
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
}

// Extend the global Window interface if needed
interface Window {
  webkitCancelAnimationFrame?: (handle: number) => void;
  webkitRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
}