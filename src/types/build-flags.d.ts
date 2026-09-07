// Build-time flags replaced by esbuild `define`. See esbuild.config.js.
//
// __BRIDGE_UI__ — whether the MCP bridge's UI (settings section + footer status
// dots) is exposed. False in production builds, which ship manifest.prod.json's
// networkAccess ["none"] and therefore cannot open a bridge socket at all.
// Interim gate for `btg`; superseded by the `__BRIDGE__` compile-out in `bfl`,
// which removes the bridge from the bundle rather than hiding its controls.
declare const __BRIDGE_UI__: boolean;
