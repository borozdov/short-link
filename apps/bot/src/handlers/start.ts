import type { CommandContext, Context } from 'grammy';

export async function handleStart(ctx: CommandContext<Context>): Promise<void> {
  await ctx.reply(
    [
      'Пришли ссылку — верну короткую link.borozdov.ru/... и QR-код.',
      '',
      'Под каждым ответом:',
      '📊 Статистика — переходы по ссылке',
      '🚫 / ✅ Отключить / Включить — выключить ссылку без удаления',
    ].join('\n'),
  );
}
