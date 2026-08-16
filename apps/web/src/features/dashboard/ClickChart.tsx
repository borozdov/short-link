import type { DailyLinkStat } from '@short-link/shared';
import styles from './ClickChart.module.css';

export interface ClickChartProps {
  dailyStats: DailyLinkStat[];
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
}

// No chart library in the repo, and one bar-per-day chart doesn't warrant adding one —
// a small inline SVG-free bar chart keeps this dependency-free and brand-consistent
// (hairline track, solid inverted bars, no shadows/gradients).
export function ClickChart({ dailyStats }: ClickChartProps) {
  if (dailyStats.length === 0) {
    return <p className={styles.empty}>Пока нет данных по дням.</p>;
  }

  const max = Math.max(1, ...dailyStats.map((stat) => stat.clickCount));

  return (
    <div className={styles.wrapper}>
      <div className={styles.chart}>
        {dailyStats.map((stat) => (
          <div key={stat.date} className={styles.column}>
            <span className={styles.count}>{stat.clickCount}</span>
            <div className={styles.barTrack}>
              <div className={styles.bar} style={{ height: `${(stat.clickCount / max) * 100}%` }} />
            </div>
            <span className={styles.day}>{formatDay(stat.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
