/// <reference types="@figma/plugin-typings" />

// Sandbox-side bridge enabled flag.
//
// Lives in a bridge module rather than as module state in code.ts so that every
// reference to it sits behind an `if (__BRIDGE__)` guard and the community build
// drops this file along with the rest of the bridge tree.
//
// Distinct from the __BRIDGE__ build flag: __BRIDGE__ decides whether the bridge
// exists in the bundle at all; this decides whether the user has switched it on.

let bridgeEnabled = false;

export function isBridgeEnabled(): boolean {
  return bridgeEnabled;
}

export function setBridgeEnabledState(enabled: boolean): void {
  bridgeEnabled = enabled;
}
