export interface EmailSender {
  send(to: string, subject: string, body: string): Promise<void>;
}

export class ConsoleEmailSender implements EmailSender {
  async send(to: string, subject: string, body: string): Promise<void> {
    console.log(`[email] to=${to} subject=${subject}\n${body}`);
  }
}
