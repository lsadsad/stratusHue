import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleBridgeMessage } from '../features/bridge/bridge-dispatch';

// bfl Phase 3 moved ~35 bridge-* cases out of code.ts's main switch into this
// module, so that the community build has exactly one guarded reference to bridge
// code instead of ~40 scattered ones. The handled/unhandled contract is what
// code.ts now relies on to decide whether to fall through to its own switch —
// these tests pin it.
describe('handleBridgeMessage — handled/unhandled contract', () => {
  beforeEach(() => {
    (globalThis as unknown as { figma: unknown }).figma = {
      ui: { postMessage: vi.fn() },
      clientStorage: { setAsync: vi.fn().mockResolvedValue(undefined) },
    };
  });

  it('reports a non-bridge message as unhandled so code.ts can fall through', async () => {
    expect(await handleBridgeMessage({ type: 'get-ui-section-states' })).toBe(false);
  });

  it('reports an unknown non-command bridge message as unhandled', async () => {
    expect(await handleBridgeMessage({ type: 'bridge-something-invented' })).toBe(false);
  });

  it('claims an unsupported bridge-cmd-* and replies with an error', async () => {
    // Silence here would hang the MCP client until its request timed out.
    const handled = await handleBridgeMessage({ type: 'bridge-cmd-not-a-real-command', requestId: 'req_1' });
    expect(handled).toBe(true);

    const post = (globalThis as unknown as { figma: { ui: { postMessage: ReturnType<typeof vi.fn> } } }).figma.ui.postMessage;
    expect(post).toHaveBeenCalledWith(expect.objectContaining({
      type: 'BRIDGE_RESPONSE',
      requestId: 'req_1',
      error: expect.stringContaining('Unsupported bridge command'),
    }));
  });

  it('does not claim an unsupported bridge-cmd-* that carries no requestId', async () => {
    // Nothing to reply to — treat it as unhandled rather than swallowing it.
    expect(await handleBridgeMessage({ type: 'bridge-cmd-not-a-real-command' })).toBe(false);
  });

  it('handles an informational bridge message without touching the UI', async () => {
    expect(await handleBridgeMessage({ type: 'bridge-connected' })).toBe(true);
    const post = (globalThis as unknown as { figma: { ui: { postMessage: ReturnType<typeof vi.fn> } } }).figma.ui.postMessage;
    expect(post).not.toHaveBeenCalled();
  });
});
