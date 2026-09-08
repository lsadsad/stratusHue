// Build-time flags replaced by esbuild `define`. See esbuild.config.js.
//
// __BRIDGE__ — whether the MCP bridge is compiled into this build at all.
// Driven by the STRATUSHUE_BRIDGE env var, deliberately independent of NODE_ENV
// so the team flavor can be a fully minified production build and still carry
// the bridge. With the flag false, every bridge module is reachable only from a
// dead branch and esbuild drops it from the bundle entirely (verified: bfl
// Discovery spike, 2026-09-08).
declare const __BRIDGE__: boolean;
