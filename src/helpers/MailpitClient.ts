import { env } from '../config/env.js';

interface MailpitMessage {
  ID: string;
  MessageID: string;
  From: { Name: string; Address: string };
  To: { Name: string; Address: string }[];
  Subject: string;
  Snippet: string;
}

interface MailpitSearchResponse {
  total: number;
  messages: MailpitMessage[];
}

interface MailpitMessageDetail {
  ID: string;
  Text: string;
  HTML: string;
  Subject: string;
}

export class MailpitClient {
  private baseUrl: string;

  constructor(baseUrl: string = env.MAILPIT_API_URL) {
    this.baseUrl = baseUrl;
  }

  async deleteAllMessages(): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/messages`, { method: 'DELETE' });
  }

  async searchMessages(query: string): Promise<MailpitSearchResponse> {
    const url = `${this.baseUrl}/api/v1/search?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    return response.json() as Promise<MailpitSearchResponse>;
  }

  async getMessage(id: string): Promise<MailpitMessageDetail> {
    const response = await fetch(`${this.baseUrl}/api/v1/message/${id}`);
    return response.json() as Promise<MailpitMessageDetail>;
  }

  async waitForMessage(
    query: string,
    { timeoutMs = 30_000, pollIntervalMs = 1_000 } = {},
  ): Promise<MailpitMessageDetail> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const result = await this.searchMessages(query);
      if (result.total > 0) {
        return this.getMessage(result.messages[0].ID);
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    throw new Error(`Mailpit: no message matching "${query}" within ${timeoutMs}ms`);
  }

  extractValidationToken(messageBody: string): string {
    // The validation email contains a link like:
    //   https://portal.example.com/user-validation?token=eyJhbG...
    const match = messageBody.match(/[?&]token=([A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+)/);
    if (!match) {
      throw new Error('Could not extract validation token from email body');
    }
    return match[1];
  }

  extractResetPasswordToken(messageBody: string): string {
    // The reset email contains a link like:
    //   https://portal.example.com/reset-password/eyJhbG...  (URL-encoded JWT)
    const match = messageBody.match(/reset-password\/([A-Za-z0-9_\-%.]+\.[A-Za-z0-9_\-%.]+\.[A-Za-z0-9_\-%.]+)/);
    if (!match) {
      throw new Error('Could not extract reset password token from email body');
    }
    return decodeURIComponent(match[1]);
  }
}
