import type { Context } from 'grammy';
import { ApiError, createLink } from '../api-client.js';
import { buildLinkKeyboard } from '../keyboard.js';
import { env } from '../config/env.js';

function extractUrl(text: string): string | null {
  const trimmed = text.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

export async function handleLinkMessage(ctx: Context): Promise<void> {
  const text = ctx.message?.text;
  if (!text) return;

  const targetUrl = extractUrl(text);
  if (!targetUrl) {
    await ctx.reply('Это не похоже на ссылку. Пришли полный URL, начиная с http:// или https://');
    return;
  }

  try {
    const link = await createLink({ targetUrl });
    const qrUrl = `${env.BOT_API_BASE_URL}${link.qrUrl}?format=png`;

    await ctx.replyWithPhoto(qrUrl, {
      caption: link.shortUrl,
      reply_markup: buildLinkKeyboard(link.secretToken, 'ACTIVE'),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      await ctx.reply(`Не получилось сократить: ${error.message}`);
      return;
    }
    throw error;
  }
}
