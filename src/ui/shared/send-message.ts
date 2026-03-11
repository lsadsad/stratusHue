// Helper function to send messages to plugin sandbox
export function sendMessage(type: string, data: Record<string, unknown> = {}): void {
  parent.postMessage({ pluginMessage: { type, ...data } }, '*');
}
