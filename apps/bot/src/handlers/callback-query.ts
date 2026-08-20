import type { Context } from 'grammy';
import { ApiError, getLinkStats, updateLinkStatus } from '../api-client.js';
import { buildLinkKeyboard, type ToggleableStatus } from '../keyboard.js';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'активна',
  DISABLED: 'отключена',
  EXPIRED: 'истекла',
};

export async function handleStatsCallback(ctx: Context, secretToken: string): Promise<void> {
  try {
    const stats = await getLinkStats(secretToken);
    await ctx.reply(
      [
        stats.shortUrl,
        `Статус: ${STATUS_LABEL[stats.status] ?? stats.status}`,
        `Переходов: ${stats.clickCount}`,
        stats.expiresAt ? `Истекает: ${stats.expiresAt}` : 'Без срока действия',
      ].join('\n'),
    );
    await ctx.answerCallbackQuery();
  } catch (error) {
    await ctx.answerCallbackQuery({
      text: error instanceof ApiError ? error.message : 'Не удалось получить статистику',
      show_alert: true,
    });
  }
}

export async function handleToggleCallback(
  ctx: Context,
  secretToken: string,
  currentStatus: ToggleableStatus,
): Promise<void> {
  const nextStatus: ToggleableStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

  try {
    const updated = await updateLinkStatus(secretToken, nextStatus);
    await ctx.editMessageReplyMarkup({
      reply_markup: buildLinkKeyboard(secretToken, updated.status as ToggleableStatus),
    });
    await ctx.answerCallbackQuery({
      text: updated.status === 'ACTIVE' ? 'Ссылка включена' : 'Ссылка отключена',
    });
  } catch (error) {
    await ctx.answerCallbackQuery({
      text: error instanceof ApiError ? error.message : 'Не удалось изменить статус',
      show_alert: true,
    });
  }
}
