// Helper function to send messages to plugin sandbox
export function sendMessage(type: string, data: Record<string, any> = {}): void {
  parent.postMessage({ pluginMessage: { type, ...data } }, '*');
}
