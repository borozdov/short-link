import { Bot } from 'grammy';
import { env } from './config/env.js';
import { handleStart } from './handlers/start.js';
import { handleLinkMessage } from './handlers/link-message.js';
import { handleStatsCallback, handleToggleCallback } from './handlers/callback-query.js';
import type { ToggleableStatus } from './keyboard.js';

export const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

bot.command('start', handleStart);
bot.on('message:text', handleLinkMessage);

bot.on('callback_query:data', async (ctx) => {
  const [action, secretToken, status] = ctx.callbackQuery.data.split(':');

  if (action === 'stats' && secretToken) {
    await handleStatsCallback(ctx, secretToken);
    return;
  }

  if (action === 'toggle' && secretToken && (status === 'ACTIVE' || status === 'DISABLED')) {
    await handleToggleCallback(ctx, secretToken, status as ToggleableStatus);
    return;
  }

  await ctx.answerCallbackQuery();
});
