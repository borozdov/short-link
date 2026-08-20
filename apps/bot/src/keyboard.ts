import { InlineKeyboard } from 'grammy';

export type ToggleableStatus = 'ACTIVE' | 'DISABLED';

export function buildLinkKeyboard(secretToken: string, status: ToggleableStatus): InlineKeyboard {
  const toggleLabel = status === 'ACTIVE' ? '🚫 Отключить' : '✅ Включить';

  return new InlineKeyboard()
    .text('📊 Статистика', `stats:${secretToken}`)
    .row()
    .text(toggleLabel, `toggle:${secretToken}:${status}`);
}
