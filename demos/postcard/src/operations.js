/** One user intent owns one immutable request ID and argument set until its outcome is known. */
export class Operations {
  constructor(onEvent = () => {}) {
    this.entries = new Map();
    this.onEvent = onEvent;
  }
  get(key) {
    return this.entries.get(key);
  }
  async run(key, args, execute) {
    let entry = this.entries.get(key);
    if (entry && JSON.stringify(entry.args) !== JSON.stringify(args))
      throw new Error('Аргументы начатой операции менять нельзя');
    if (!entry) {
      entry = {
        requestId: crypto.randomUUID(),
        args: structuredClone(args),
        status: 'new',
        attempts: 0,
      };
      this.entries.set(key, entry);
    }
    if (entry.status === 'done') return entry.result;
    if (entry.promise) return entry.promise;
    entry.attempts++;
    entry.status = 'pending';
    this.notify('attempt', key, entry);
    entry.promise = Promise.resolve().then(async () => {
      try {
        entry.result = await execute(entry);
        entry.status = 'done';
        this.notify('done', key, entry);
        return entry.result;
      } catch (error) {
        entry.status = error.code === 'failed' ? 'failed' : 'unknown';
        entry.operationId = error.operationId ?? entry.operationId;
        entry.jobId = error.jobId ?? entry.jobId;
        entry.failureResult = error.result;
        entry.error = error;
        this.notify('error', key, entry);
        throw error;
      } finally {
        entry.promise = null;
      }
    });
    return entry.promise;
  }
  notify(event, key, entry) {
    try {
      this.onEvent(event, key, entry);
    } catch {
      /* Diagnostics cannot repeat or cancel an operation. */
    }
  }
  /** Only an explicit new capture or a definitely unsuccessful zero-money payment may get another ID. */
  newAttempt(key) {
    const entry = this.entries.get(key);
    if (!entry) return;
    const capture =
      key === 'capture' && ['done', 'failed'].includes(entry.status);
    const extend = key === 'extend' && entry.status === 'done';
    const payment =
      ['base-payment', 'extra-payment'].includes(key) &&
      entry.status === 'failed' &&
      entry.failureResult?.amountPaid === 0 &&
      ['declined', 'failed', 'cancelled', 'timeout'].includes(
        entry.failureResult?.status,
      );
    if (!capture && !payment && !extend)
      throw new Error('Сначала нужно установить результат прежней операции');
    this.entries.delete(key);
  }
}
export const extraCost = (copies, sheetPrice) =>
  Math.round(Math.max(0, copies - 1) * sheetPrice * 100) / 100;
export function canRestartPayment(error) {
  return (
    error.code === 'failed' &&
    error.result?.amountPaid === 0 &&
    ['declined', 'failed', 'cancelled', 'timeout'].includes(
      error.result?.status,
    )
  );
}
