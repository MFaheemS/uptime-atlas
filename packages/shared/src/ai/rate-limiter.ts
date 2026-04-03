// Simple in-memory rate limiter for Groq API calls (limit: 30 req/min)
const LIMIT = 28; // stay slightly under the 30/min limit
const WINDOW_MS = 60_000;

let callCount = 0;
let windowStart = Date.now();
const queue: Array<() => void> = [];

function resetWindowIfNeeded() {
  if (Date.now() - windowStart >= WINDOW_MS) {
    callCount = 0;
    windowStart = Date.now();
  }
}

function processQueue() {
  resetWindowIfNeeded();
  if (queue.length === 0) return;
  if (callCount >= LIMIT) {
    const delay = WINDOW_MS - (Date.now() - windowStart) + 100;
    setTimeout(processQueue, delay);
    return;
  }
  const next = queue.shift();
  if (next) {
    callCount++;
    next();
    // Process more if window allows
    setTimeout(processQueue, 0);
  }
}

export function acquireGroqSlot(): Promise<void> {
  resetWindowIfNeeded();
  if (callCount < LIMIT) {
    callCount++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    queue.push(resolve);
    const delay = WINDOW_MS - (Date.now() - windowStart) + 100;
    setTimeout(processQueue, delay);
  });
}
