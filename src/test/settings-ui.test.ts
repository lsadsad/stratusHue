import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const postMessage = vi.fn();

vi.mock('../ui/shared/send-message', () => ({
  sendMessage: (type: string, data?: Record<string, unknown>) => {
    postMessage(type, data);
  },
}));

describe('settings-ui date controls', () => {
  beforeEach(() => {
    postMessage.mockClear();
    document.body.innerHTML = `
      <div id="date-format-control">
        <button class="segmented-btn" data-value="numeric">Numeric</button>
        <button class="segmented-btn" data-value="alpha">Alpha</button>
      </div>
      <div id="date-position-control">
        <button class="segmented-btn" data-value="prefix">Prefix</button>
        <button class="segmented-btn" data-value="suffix">Suffix</button>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('setupDateSettings sends set-date-settings when format changes', async () => {
    const { setupDateSettings, setCurrentDateFormat, setCurrentDatePosition } = await import('../ui/navigate/settings-ui');
    setCurrentDateFormat('numeric');
    setCurrentDatePosition('prefix');
    setupDateSettings();

    const alphaBtn = document.querySelector('#date-format-control [data-value="alpha"]') as HTMLButtonElement;
    alphaBtn.click();

    expect(postMessage).toHaveBeenCalledWith('set-date-settings', {
      format: 'alpha',
      position: 'prefix',
    });
  });

  it('setupDateSettings sends set-date-settings when position changes', async () => {
    const { setupDateSettings, setCurrentDateFormat, setCurrentDatePosition } = await import('../ui/navigate/settings-ui');
    setCurrentDateFormat('numeric');
    setCurrentDatePosition('prefix');
    setupDateSettings();

    const suffixBtn = document.querySelector('#date-position-control [data-value="suffix"]') as HTMLButtonElement;
    suffixBtn.click();

    expect(postMessage).toHaveBeenCalledWith('set-date-settings', {
      format: 'numeric',
      position: 'suffix',
    });
  });

  it('updateDateSettingsUI syncs segmented control active states', async () => {
    const { setupDateSettings, updateDateSettingsUI } = await import('../ui/navigate/settings-ui');
    setupDateSettings();
    updateDateSettingsUI('alpha', 'suffix');

    expect(document.querySelector('#date-format-control [data-value="alpha"]')?.classList.contains('active')).toBe(true);
    expect(document.querySelector('#date-position-control [data-value="suffix"]')?.classList.contains('active')).toBe(true);
    expect(document.querySelector('#date-format-control [data-value="alpha"]')?.getAttribute('aria-checked')).toBe('true');
    expect(document.querySelector('#date-position-control [data-value="suffix"]')?.getAttribute('aria-checked')).toBe('true');
  });

  it('setupDateSettings supports keyboard navigation for segmented controls', async () => {
    const { setupDateSettings, setCurrentDateFormat, setCurrentDatePosition } = await import('../ui/navigate/settings-ui');
    setCurrentDateFormat('numeric');
    setCurrentDatePosition('prefix');
    setupDateSettings();

    const numericBtn = document.querySelector('#date-format-control [data-value="numeric"]') as HTMLButtonElement;
    numericBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(postMessage).toHaveBeenCalledWith('set-date-settings', {
      format: 'alpha',
      position: 'prefix',
    });
    expect(document.querySelector('#date-format-control [data-value="alpha"]')?.getAttribute('aria-checked')).toBe('true');
  });
});
