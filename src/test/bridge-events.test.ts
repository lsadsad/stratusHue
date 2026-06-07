import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendBridgeSelectionEvent,
  sendBridgePageEvent,
  sendBridgeDocumentEvent,
} from '../ui/ui-communication';

// These senders post sandbox→UI messages whose payload (after broadcastEvent wraps it
// as `data`) must match the figma-studio server's SelectionInfo / DocumentChangeEntry /
// PAGE_CHANGE contracts — otherwise the server silently ignores the event.

function lastPost(): Record<string, any> | null {
  const post = (globalThis as any).figma.ui.postMessage as ReturnType<typeof vi.fn>;
  const calls = post.mock.calls;
  return calls.length ? (calls[calls.length - 1][0] as Record<string, any>) : null;
}

describe('bridge event senders → server contract shapes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).figma.currentPage.name = 'Cover';
    (globalThis as any).figma.currentPage.id = 'page-1';
    (globalThis as any).figma.currentPage.selection = [];
  });

  it('selection event matches SelectionInfo: nodes/count/page(name)/timestamp', () => {
    (globalThis as any).figma.currentPage.selection = [
      { id: 'n1', name: 'Rect', type: 'RECTANGLE', width: 10, height: 20 },
      { id: 'n2', name: 'Text', type: 'TEXT', width: 30, height: 40 },
    ];

    sendBridgeSelectionEvent();
    const msg = lastPost()!;

    expect(msg.type).toBe('bridge-selection-change'); // UI routing key (preserved)
    expect(msg.nodes).toEqual([
      { id: 'n1', name: 'Rect', type: 'RECTANGLE', width: 10, height: 20 },
      { id: 'n2', name: 'Text', type: 'TEXT', width: 30, height: 40 },
    ]);
    expect(msg.count).toBe(2);
    expect(msg.page).toBe('Cover'); // page NAME, not pageId
    expect(typeof msg.timestamp).toBe('number');
  });

  it('page event provides pageName + pageId', () => {
    sendBridgePageEvent();
    const msg = lastPost()!;
    expect(msg.pageName).toBe('Cover');
    expect(msg.pageId).toBe('page-1');
  });

  it('document event derives change flags, ids (<=50), and count', () => {
    const event = {
      documentChanges: [
        { type: 'CREATE', id: 'a' },
        { type: 'STYLE_PROPERTY_CHANGE' },
        { type: 'PROPERTY_CHANGE', id: 'b' },
      ],
    } as unknown as DocumentChangeEvent;

    sendBridgeDocumentEvent(event);
    const msg = lastPost()!;

    expect(msg.hasNodeChanges).toBe(true);
    expect(msg.hasStyleChanges).toBe(true);
    expect(msg.changedNodeIds).toEqual(['a', 'b']);
    expect(msg.changeCount).toBe(3);
    expect(typeof msg.timestamp).toBe('number');
  });

  it('document event does NOT post when there are no style/node changes', () => {
    const event = { documentChanges: [] } as unknown as DocumentChangeEvent;
    sendBridgeDocumentEvent(event);
    expect(lastPost()).toBeNull();
  });
});
