declare global {
  interface Window {
    ym?: (counterId: number, action: string, target: string, params?: Record<string, unknown>) => void;
  }
}

const COUNTER_ID = 111688230;

export function reachGoal(target: string, params?: Record<string, unknown>): void {
  window.ym?.(COUNTER_ID, 'reachGoal', target, params);
}
