/**
 * Adaptive debounce: clamp(minDelay, lastDuration * multiplier, maxDelay)
 * Adjusts delay based on how long the last evaluation took,
 * but caps at maxDelay to prevent UI sluggishness.
 */
export function createAdaptiveDebounce(
  fn: (...args: unknown[]) => void,
  minDelay = 100,
  multiplier = 1.5,
  maxDelay = 400,
): {
  call: (...args: unknown[]) => void;
  updateTiming: (durationMs: number) => void;
  cancel: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastDuration = 0;

  function getDelay(): number {
    return Math.min(maxDelay, Math.max(minDelay, lastDuration * multiplier));
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
