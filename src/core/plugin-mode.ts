/// <reference types="@figma/plugin-typings" />

export type PluginMode = 'navigate' | 'scaffold';

let _currentMode: PluginMode = 'navigate';

export function getCurrentMode(): PluginMode {
  return _currentMode;
}

export async function loadPluginMode(): Promise<PluginMode> {
  const stored = await figma.clientStorage.getAsync('pluginMode') as string | undefined;
  if (stored === 'scaffold') {
    _currentMode = 'scaffold';
  } else {
    _currentMode = 'navigate';
    if (stored === 'lint') {
      await figma.clientStorage.setAsync('pluginMode', 'navigate');
    }
  }
  return _currentMode;
}

export async function persistPluginMode(mode: PluginMode): Promise<void> {
  _currentMode = mode;
  await figma.clientStorage.setAsync('pluginMode', mode);
}
