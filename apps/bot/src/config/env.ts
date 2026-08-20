import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  TELEGRAM_BOT_TOKEN: required('TELEGRAM_BOT_TOKEN'),
  BOT_API_BASE_URL: process.env.BOT_API_BASE_URL ?? 'http://localhost:4000',
};
