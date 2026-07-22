export function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function randomLatency(min = 350, max = 900): number {
  return Math.floor(Math.random() * (max - min)) + min;
}
