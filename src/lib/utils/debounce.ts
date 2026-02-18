/**
 * Adaptive debounce: max(100ms, lastDuration * 1.5)
 * Adjusts delay based on how long the last evaluation took.
 */
export function createAdaptiveDebounce(
  fn: (...args: unknown[]) => void,
  minDelay = 100,
  multiplier = 1.5,
): {
  call: (...args: unknown[]) => void;
  updateTiming: (durationMs: number) => void;
  cancel: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastDuration = 0;

  function getDelay(): number {
    return Math.max(minDelay, lastDuration * multiplier);
  }

  function call(...args: unknown[]): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, getDelay());
  }

  function updateTiming(durationMs: number): void {
    lastDuration = durationMs;
  }

  function cancel(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return { call, updateTiming, cancel };
}
