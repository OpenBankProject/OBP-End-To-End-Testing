import { type Page } from '@playwright/test';

/**
 * Captures and auto-accepts native browser dialogs (alert/confirm), which
 * API Manager uses for success/error feedback and delete confirmations.
 * Register one per page before triggering actions that open dialogs.
 */
export class DialogWatcher {
  readonly messages: string[] = [];

  constructor(page: Page) {
    page.on('dialog', async (dialog) => {
      this.messages.push(dialog.message());
      await dialog.accept();
    });
  }

  /** Wait until a dialog whose message contains `substring` has been seen. */
  async waitFor(substring: string, timeoutMs = 10_000): Promise<string> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const hit = this.messages.find((m) => m.includes(substring));
      if (hit) return hit;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(
      `Dialog containing "${substring}" not seen within ${timeoutMs}ms. ` +
        `Dialogs seen: ${JSON.stringify(this.messages)}`,
    );
  }
}
