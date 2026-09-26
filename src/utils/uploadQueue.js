// Adaptive Concurrency Queue Manager for Upload Workspace
import { isRetryableError } from '../constants/uploadConstants.js';

const MIN_CONCURRENCY = 2;
const MAX_CONCURRENCY = 6;
const DEFAULT_CONCURRENCY = 4;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 15000;
const CONSECUTIVE_SUCCESS_THRESHOLD = 5; // Successes before increasing concurrency
const THROTTLE_COOLDOWN_MS = 10000; // Cooldown after a 429/timeout before increasing

function detectInitialConcurrency() {
  if (typeof navigator === 'undefined') return DEFAULT_CONCURRENCY;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return DEFAULT_CONCURRENCY;

  if (connection.saveData) return MIN_CONCURRENCY;

  const effectiveType = connection.effectiveType;
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return MIN_CONCURRENCY;
  }
  if (effectiveType === '3g') {
    return 3;
  }
  if (effectiveType === '4g') {
    if (connection.downlink && connection.downlink >= 10 && connection.rtt && connection.rtt < 100) {
      return 5;
    }
    return 4;
  }
  return DEFAULT_CONCURRENCY;
}

export function parseRetryAfter(response) {
  if (!response?.headers) return null;
  const retryHeader =
    (typeof response.headers.get === 'function' ? response.headers.get('retry-after') : null) ||
    response.headers['retry-after'] ||
    response.headers['Retry-After'];

  if (!retryHeader) return null;

  const seconds = parseInt(retryHeader, 10);
  if (!isNaN(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const dateMs = Date.parse(retryHeader);
  if (!isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    return delta > 0 ? delta : 0;
  }

  return null;
}

export function calculateBackoff(attempt, retryAfterMs = null) {
  if (typeof retryAfterMs === 'number' && retryAfterMs > 0) {
    return Math.min(retryAfterMs, MAX_BACKOFF_MS);
  }
  const exp = Math.min(attempt, 5);
  const base = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, exp));
  const jitter = Math.floor(Math.random() * (base * 0.3));
  return Math.min(MAX_BACKOFF_MS, base + jitter);
}

export class UploadQueue {
  constructor(options = {}) {
    this.concurrency = options.concurrency || detectInitialConcurrency();
    this.minConcurrency = options.minConcurrency || MIN_CONCURRENCY;
    this.maxConcurrency = options.maxConcurrency || MAX_CONCURRENCY;
    this.queue = [];
    this.runningCount = 0;
    this.consecutiveSuccesses = 0;
    this.lastThrottledAt = Date.now();
    this.activeTasks = new Map(); // id -> { abortController, task }
  }

  getConcurrency() {
    return this.concurrency;
  }

  onRateLimitedOrTimeout() {
    this.lastThrottledAt = Date.now();
    this.consecutiveSuccesses = 0;
    if (this.concurrency > this.minConcurrency) {
      this.concurrency = Math.max(this.minConcurrency, this.concurrency - 1);
    }
  }

  onTaskSuccess() {
    this.consecutiveSuccesses += 1;
    const now = Date.now();
    if (
      this.consecutiveSuccesses >= CONSECUTIVE_SUCCESS_THRESHOLD &&
      now - this.lastThrottledAt > THROTTLE_COOLDOWN_MS &&
      this.concurrency < this.maxConcurrency
    ) {
      this.concurrency = Math.min(this.maxConcurrency, this.concurrency + 1);
      this.consecutiveSuccesses = 0;
    }
  }

  enqueue(taskId, taskFn, options = {}) {
    return new Promise((resolve, reject) => {
      const item = {
        taskId,
        taskFn,
        attempt: options.attempt || 0,
        maxRetries: options.maxRetries !== undefined ? options.maxRetries : MAX_RETRIES,
        signal: options.signal,
        onProgress: options.onProgress,
        resolve,
        reject,
      };

      this.queue.push(item);
      this._processNext();
    });
  }

  cancelTask(taskId) {
    // If queued, remove from queue
    const index = this.queue.findIndex(item => item.taskId === taskId);
    if (index !== -1) {
      const [item] = this.queue.splice(index, 1);
      const abortErr = new Error('การอัปโหลดไฟล์ถูกยกเลิก');
      abortErr.code = 'ERR_CANCELED';
      abortErr.name = 'CanceledError';
      item.reject(abortErr);
    }

    // If active, abort it
    const active = this.activeTasks.get(taskId);
    if (active) {
      active.abortController?.abort();
      this.activeTasks.delete(taskId);
    }
  }

  cancelAll() {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      const abortErr = new Error('การอัปโหลดไฟล์ถูกยกเลิก');
      abortErr.code = 'ERR_CANCELED';
      abortErr.name = 'CanceledError';
      item.reject(abortErr);
    }

    for (const [, active] of this.activeTasks) {
      active.abortController?.abort();
    }
    this.activeTasks.clear();
  }

  _processNext() {
    while (this.runningCount < this.concurrency && this.queue.length > 0) {
      const item = this.queue.shift();

      if (item.signal?.aborted) {
        const abortErr = new Error('การอัปโหลดไฟล์ถูกยกเลิก');
        abortErr.code = 'ERR_CANCELED';
        abortErr.name = 'CanceledError';
        item.reject(abortErr);
        continue;
      }

      this._runTask(item);
    }
  }

  async _runTask(item) {
    this.runningCount += 1;
    const taskAbortController = new AbortController();

    const forwardAbort = () => {
      taskAbortController.abort();
    };

    if (item.signal) {
      item.signal.addEventListener('abort', forwardAbort, { once: true });
    }

    this.activeTasks.set(item.taskId, {
      abortController: taskAbortController,
      item,
    });

    try {
      const result = await item.taskFn({
        signal: taskAbortController.signal,
        onProgress: item.onProgress,
        attempt: item.attempt,
      });

      this.activeTasks.delete(item.taskId);
      this.runningCount -= 1;
      this.onTaskSuccess();
      item.resolve(result);
    } catch (error) {
      this.activeTasks.delete(item.taskId);
      this.runningCount -= 1;

      if (item.signal) {
        item.signal.removeEventListener('abort', forwardAbort);
      }

      // Check if aborted by caller
      if (taskAbortController.signal.aborted || item.signal?.aborted) {
        item.reject(error);
        this._processNext();
        return;
      }

      const status = error.response?.status || error.status;
      const isOverloaded = status === 429 || (status >= 500 && status < 600) || error.code === 'ECONNABORTED';

      if (isOverloaded) {
        this.onRateLimitedOrTimeout();
      }

      // Check retry eligibility
      const canRetry = item.attempt < item.maxRetries && isRetryableError(error);

      if (canRetry) {
        const retryAfterMs = parseRetryAfter(error.response);
        const delayMs = calculateBackoff(item.attempt, retryAfterMs);

        setTimeout(() => {
          if (item.signal?.aborted) {
            item.reject(error);
            return;
          }
          item.attempt += 1;
          this.queue.unshift(item); // Prioritize retrying task
          this._processNext();
        }, delayMs);
      } else {
        item.reject(error);
      }
    }

    this._processNext();
  }
}

// Global shared instance for application-wide adaptive concurrency
export const globalUploadQueue = new UploadQueue();
