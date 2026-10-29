/** Isolated browser client. The app chooses prices; the backend executes and journals operations. */
import type {
  CapturePhotoResponse,
  ExternalAppCommand,
  ExternalAppObservation,
  ExternalCommandReceipt,
  ExternalContextResponse,
  ExternalCamerasResponse,
  ExternalEffect,
  ExternalFrame,
  ExternalStateResponse,
  ExternalShareResult,
  PrintJobResponse,
} from './types.js';
const API = '/api/v1/external/runtime';
declare global {
  interface Window {
    pbtService?: {
      readonly protocol: 1;
      requestExit?(): Promise<void>;
      onLifecycle(handler: (event: 'start' | 'pause' | 'resume' | 'stop') => void): () => void;
    };
  }
}
// OpenAPI's generated defaults are non-nullable; callers may omit these backend defaults.
type CommandDefaults = 'copies' | 'photo_id' | 'photo_ids' | 'amount' | 'camera' | 'cut';
export type ExternalCommand = Omit<ExternalAppCommand, CommandDefaults> &
  Partial<Pick<ExternalAppCommand, CommandDefaults>>;
export type ExternalAction = ExternalCommand['action'];
export type ExternalContext = ExternalContextResponse;
export type { ExternalCamerasResponse, ExternalEffect, ExternalFrame } from './types.js';
export type ExternalState = ExternalStateResponse;
export type ExternalPayment = ExternalState['payments'][number];
export type ExternalPrintJob = ExternalState['printJobs'][number];
export type ExternalPhoto = CapturePhotoResponse;
export type ExternalCamera = ExternalCamerasResponse['cameras'][number];
export type ExternalCameraId = ExternalCamera['id'];
export interface ExternalOperationOptions {
  /** Reuse this ID to resume an uncertain request, never generate a new one for a retry. */
  requestId?: string;
  /** Local waiting limit, in milliseconds. Reaching it does not cancel the operation. */
  timeoutMs?: number;
}
export interface ExternalPaymentOptions extends ExternalOperationOptions {
  onProgress?: (payment: ExternalPayment) => void;
}
export interface ExternalPrintOptions extends ExternalOperationOptions {
  cut?: boolean;
  onProgress?: (job: ExternalPrintJob) => void;
}
export type ExternalShare = ExternalShareResult;
type OperationDetails = {
  requestId?: string;
  operationId?: string;
  jobId?: string;
  result?: ExternalPayment | ExternalPrintJob;
};
export class ExternalOperationError extends Error {
  readonly requestId?: string;
  readonly operationId?: string;
  readonly jobId?: string;
  readonly result?: ExternalPayment | ExternalPrintJob;
  constructor(
    message: string,
    readonly code: 'timeout' | 'transport' | 'failed',
    details: OperationDetails = {},
  ) {
    super(message);
    this.name = 'ExternalOperationError';
    this.requestId = details.requestId;
    this.operationId = details.operationId;
    this.jobId = details.jobId;
    this.result = details.result;
  }
}
export type ExternalObservation = Pick<ExternalAppObservation, 'event_id' | 'name'> &
  Partial<Omit<ExternalAppObservation, 'event_id' | 'name'>>;
type EventData = Record<string, string | number | boolean | null>;
export class ExternalClient {
  #exitRequestId?: string;
  #refundRequestId?: string;
  #heartbeat?: ReturnType<typeof setInterval>;
  #telemetryTimer?: ReturnType<typeof setInterval>;
  #pending: ExternalObservation[] = [];
  #sending?: Promise<void>;
  #telemetryDisabled = false;
  #failures = 0;
  #dropped = 0;
  #removeErrors?: () => void;
  #telemetryClock?: { elapsedMs: number; localMs: number };
  constructor(private readonly fetcher: typeof fetch = (input, init) => fetch(input, init)) {}

  private async call<T>(path: string, body?: unknown, timeoutMs = 15_000): Promise<T> {
    const response = await this.fetcher(API + path, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(Math.max(1, Math.ceil(timeoutMs))),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error?.message ?? data.error ?? `HTTP ${response.status}`);
    return data as T;
  }

  context(): Promise<ExternalContext> {
    return this.call('/context');
  }
  /** Enabled frames from this service, or the terminal catalog when no private list is assigned. */
  frames(): Promise<ExternalFrame[]> {
    return this.call('/frames');
  }
  /** CSS filters and cached preview images from the center. Requires config:read. */
  effects(): Promise<ExternalEffect[]> {
    return this.call('/effects');
  }
  cameras(): Promise<ExternalCamerasResponse> {
    return this.call('/cameras');
  }
  /** Explicit application activity; automatic heartbeats still do not postpone standby. */
  async resetIdleTimer(): Promise<void> {
    await this.call('/activity', {});
  }
  state(): Promise<ExternalState> {
    return this.call('/state');
  }
  async ready(): Promise<void> {
    const ready = await this.call<{ elapsedMs?: number }>('/ready', {});
    // Anchor once per client. Repeated ready() calls must not shift queued timestamps.
    // Older backends omit elapsedMs, so keep sending their original observation shape.
    if (!this.#telemetryClock && Number.isSafeInteger(ready.elapsedMs) && ready.elapsedMs! >= 0) {
      this.#telemetryClock = { elapsedMs: ready.elapsedMs!, localMs: performance.now() };
    }
    this.dispose();
    this.#heartbeat = setInterval(() => {
      void this.call('/heartbeat', {}).catch(() => undefined);
    }, 5000);
    this.#telemetryTimer = setInterval(() => {
      void this.flushTelemetry();
    }, 2000);
    if (typeof window !== 'undefined') {
      const error = (event: ErrorEvent) =>
        this.logError(
          event.error ?? event.message,
          {
            line: event.lineno || 0,
            column: event.colno || 0,
          },
          'javascript.error',
        );
      const rejected = (event: PromiseRejectionEvent) =>
        this.logError(event.reason, {}, 'promise.rejection');
      window.addEventListener('error', error);
      window.addEventListener('unhandledrejection', rejected);
      this.#removeErrors = () => {
        window.removeEventListener('error', error);
        window.removeEventListener('unhandledrejection', rejected);
      };
    }
  }
  dispose(): void {
    if (this.#heartbeat) clearInterval(this.#heartbeat);
    this.#heartbeat = undefined;
    if (this.#telemetryTimer) clearInterval(this.#telemetryTimer);
    this.#telemetryTimer = undefined;
    this.#removeErrors?.();
    this.#removeErrors = undefined;
    void this.flushTelemetry();
  }

  get diagnosticsDropped(): number {
    return this.#dropped;
  }

  /** Logical events only: never pass photographs, credentials or customer data. */
  track(name: string, data: EventData = {}): void {
    try {
      this.observe({ name, kind: 'event', data });
    } catch {
      this.#dropped++;
    }
  }
  stage(name: string): void {
    try {
      this.observe({ name, kind: 'stage' });
    } catch {
      this.#dropped++;
    }
  }
  logError(error: unknown, data: EventData = {}, name = 'application.error'): void {
    try {
      this.observe({
        name,
        kind: 'error',
        data,
        message: (error instanceof Error ? error.message : String(error)).slice(0, 500),
        stack: error instanceof Error ? (error.stack?.slice(0, 1000) ?? '') : '',
      });
    } catch {
      /* Observability cannot break the service. */
    }
  }

  private observe(value: Omit<ExternalObservation, 'event_id'>): void {
    if (this.#telemetryDisabled || !/^[a-z][a-z0-9_.-]{0,47}$/.test(value.name)) return;
    if (this.#pending.length >= 32) {
      this.#dropped++;
      return;
    }
    const data: EventData = {};
    for (const [key, item] of Object.entries(value.data ?? {}).slice(0, 10)) {
      if (!/^[a-z][a-z0-9_.-]{0,39}$/.test(key)) continue;
      if (item !== null && !['string', 'number', 'boolean'].includes(typeof item)) continue;
      if (typeof item === 'number' && (!Number.isFinite(item) || Math.abs(item) > 1e12)) continue;
      data[key] = typeof item === 'string' ? item.slice(0, 160) : item;
    }
    const clock = this.#telemetryClock;
    const timestamp = clock
      ? { elapsed_ms: Math.floor(clock.elapsedMs + Math.max(0, performance.now() - clock.localMs)) }
      : {};
    this.#pending.push({ ...value, data, ...timestamp, event_id: crypto.randomUUID() });
  }

  /** Best effort; retries keep event IDs and cannot repeat physical/financial operations. */
  flushTelemetry(): Promise<void> {
    if (this.#sending) return this.#sending;
    if (!this.#pending.length || this.#telemetryDisabled) return Promise.resolve();
    this.#sending = this.sendTelemetry().finally(() => {
      this.#sending = undefined;
    });
    return this.#sending;
  }

  private async sendTelemetry(): Promise<void> {
    if (!this.#pending.length || this.#telemetryDisabled) return;
    const batch: ExternalObservation[] = [];
    for (const item of this.#pending.slice(0, 5)) {
      if (new TextEncoder().encode(JSON.stringify({ events: [...batch, item] })).length > 7000)
        break;
      batch.push(item);
    }
    if (!batch.length) {
      this.#pending.shift();
      this.#dropped++;
      return;
    }
    try {
      const response = await this.fetcher(API + '/telemetry', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        signal: AbortSignal.timeout(2000),
      });
      if ([401, 403, 404].includes(response.status)) {
        this.#telemetryDisabled = true;
        this.#dropped += this.#pending.length;
        this.#pending = [];
        return;
      }
      if (!response.ok) throw new Error('Telemetry unavailable');
      this.#pending.splice(0, batch.length);
      this.#failures = 0;
    } catch {
      if (++this.#failures >= 3) {
        this.#pending.splice(0, batch.length);
        this.#dropped += batch.length;
        this.#failures = 0;
      }
    }
  }
  async submit(command: ExternalCommand): Promise<ExternalCommandReceipt> {
    try {
      return await this.call('/commands', command);
    } catch (error) {
      throw new ExternalOperationError(String(error), 'transport', {
        requestId: command.request_id,
      });
    }
  }

  /** Amounts in this API, including progress and results, are in rubles. */
  async payment(amount?: number, options: ExternalPaymentOptions = {}): Promise<ExternalPayment> {
    const requestId = options.requestId ?? crypto.randomUUID();
    if (amount !== undefined) {
      const cents = amount * 100;
      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 1_000_000 ||
        Math.abs(cents - Math.round(cents)) > 1e-7
      )
        throw new ExternalOperationError(
          'Укажите сумму в рублях с точностью до копейки',
          'failed',
          { requestId },
        );
      // Remove only binary floating-point noise (e.g. 0.1 + 0.2), never round a sub-kopeck price.
      amount = Math.round(cents) / 100;
    }
    const timeoutMs = options.timeoutMs ?? 600_000;
    const started = performance.now();
    const payment = await this.command<ExternalPayment>(
      { request_id: requestId, action: 'payment', ...(amount === undefined ? {} : { amount }) },
      timeoutMs,
    );
    return this.waitPayment(payment.operationId, {
      ...options,
      requestId,
      timeoutMs: Math.max(0, timeoutMs - (performance.now() - started)),
    });
  }

  /** Extend the current partial cash payment; returns its updated state without creating another payment. */
  extendCashWait(options: ExternalOperationOptions = {}): Promise<ExternalPayment> {
    return this.command<ExternalPayment>(
      { request_id: options.requestId ?? crypto.randomUUID(), action: 'extend' },
      options.timeoutMs,
    );
  }

  /** Request the backend's refund policy and close the run. The receipt is not a bank refund confirmation. */
  async requestRefund(
    options: Pick<ExternalOperationOptions, 'requestId'> = {},
  ): Promise<ExternalCommandReceipt> {
    const requestId = options.requestId ?? (this.#refundRequestId ??= crypto.randomUUID());
    await this.flushTelemetry();
    return this.submit({ request_id: requestId, action: 'refund' });
  }

  /** Resume waiting for this exact payment; does not create another charge. */
  waitPayment(operationId: string, options: ExternalPaymentOptions = {}): Promise<ExternalPayment> {
    const details = { requestId: options.requestId, operationId };
    return this.poll(
      (state) => {
        const payment = state.payments.find((p) => p.operationId === operationId);
        if (!payment) return;
        this.progress(options.onProgress, payment);
        if (payment.status === 'completed' && payment.amountPaid >= payment.amountDue)
          return payment;
        if (payment.status !== 'pending')
          throw new ExternalOperationError(payment.error || 'Оплата не подтверждена', 'failed', {
            ...details,
            result: payment,
          });
      },
      options.timeoutMs ?? 600_000,
      details,
    );
  }

  capture(
    options: ExternalOperationOptions & { camera?: ExternalCameraId } = {},
  ): Promise<ExternalPhoto> {
    return this.command<ExternalPhoto>(
      {
        request_id: options.requestId ?? crypto.randomUUID(),
        action: 'capture',
        ...(options.camera === undefined ? {} : { camera: options.camera }),
      },
      options.timeoutMs,
    );
  }

  /** Publish the final selection. Show qrUrl before complete(); retries reuse the same requestId. */
  share(photoIds: string[], options: ExternalOperationOptions = {}): Promise<ExternalShare> {
    return this.command<ExternalShare>(
      {
        request_id: options.requestId ?? crypto.randomUUID(),
        action: 'share',
        photo_ids: [...photoIds],
      },
      options.timeoutMs ?? 600_000,
    );
  }

  /** Read the prepared link without uploading or creating another gallery. */
  sharedPhotos(): Promise<ExternalShare> {
    return this.call('/share');
  }

  async print(
    photoId: string,
    copies = 1,
    options: ExternalPrintOptions = {},
  ): Promise<ExternalPrintJob> {
    const requestId = options.requestId ?? crypto.randomUUID();
    const timeoutMs = options.timeoutMs ?? 600_000;
    const started = performance.now();
    const job = await this.command<PrintJobResponse>(
      {
        request_id: requestId,
        action: 'print',
        photo_id: photoId,
        copies,
        ...(options.cut === undefined ? {} : { cut: options.cut }),
      },
      timeoutMs,
    );
    return this.waitPrint(job.jobId, {
      ...options,
      requestId,
      timeoutMs: Math.max(0, timeoutMs - (performance.now() - started)),
    });
  }

  /** Resume waiting for this exact job; never submits another print job. */
  waitPrint(jobId: string, options: ExternalPrintOptions = {}): Promise<ExternalPrintJob> {
    const details = { requestId: options.requestId, jobId };
    return this.poll(
      (state) => {
        const job = state.printJobs.find((p) => p.jobId === jobId);
        if (!job) return;
        this.progress(options.onProgress, job);
        if (job.phase === 'done' && job.copiesDone === job.copies) return job;
        if (['done', 'failed', 'cancelled'].includes(job.phase))
          throw new ExternalOperationError(
            job.error || 'Выдача всех листов не подтверждена',
            'failed',
            {
              ...details,
              result: job,
            },
          );
      },
      options.timeoutMs ?? 600_000,
      details,
    );
  }

  /** The backend confirms completion in the response, before the shell closes this view. */
  async complete(
    options: Pick<ExternalOperationOptions, 'requestId'> = {},
  ): Promise<ExternalCommandReceipt> {
    await this.flushTelemetry();
    const requestId = options.requestId ?? crypto.randomUUID();
    const receipt = await this.submit({ request_id: requestId, action: 'complete' });
    if (receipt.state !== 'done')
      throw new ExternalOperationError('Завершение услуги не подтверждено', 'failed', {
        requestId,
      });
    return receipt;
  }

  private progress<T>(callback: ((value: T) => void) | undefined, value: T): void {
    try {
      void Promise.resolve(callback?.(value)).catch((error) => this.logError(error));
    } catch (error) {
      this.logError(error);
    }
  }

  private async poll<T>(
    inspect: (state: ExternalState) => T | undefined,
    timeoutMs: number,
    details: OperationDetails,
  ): Promise<T> {
    const deadline = performance.now() + timeoutMs;
    while (performance.now() < deadline) {
      let state: ExternalState;
      try {
        state = await this.call(
          '/state',
          undefined,
          Math.min(15_000, Math.max(1, deadline - performance.now())),
        );
      } catch (error) {
        throw new ExternalOperationError(String(error), 'transport', details);
      }
      const result = inspect(state);
      if (result !== undefined) return result;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(700, Math.max(0, deadline - performance.now()))),
      );
    }
    throw new ExternalOperationError(
      'Результат ещё не подтверждён. Продолжите ожидание этой же операции; новая команда повторит действие.',
      'timeout',
      details,
    );
  }
  /** Open the shell's confirmation. Resolution means shown, not visitor approval. */
  async requestExit(): Promise<void> {
    const bridge = typeof window === 'undefined' ? undefined : window.pbtService;
    if (!bridge?.requestExit)
      throw new Error('Подтверждение выхода недоступно в этой версии оболочки');
    await bridge.requestExit();
  }
  /** Voluntary exit without a dialog. Default retries reuse the same cancellation ID. */
  async exit(
    requestId = (this.#exitRequestId ??= crypto.randomUUID()),
  ): Promise<ExternalCommandReceipt> {
    await this.flushTelemetry();
    return this.submit({ request_id: requestId, action: 'cancel' });
  }
  /** A retry MUST reuse this request_id and identical arguments. A new ID is a new operation. */
  async command<T = unknown>(command: ExternalCommand, timeoutMs = 120_000): Promise<T> {
    const closing = ['complete', 'cancel', 'refund'].includes(command.action);
    if (closing) await this.flushTelemetry();
    const receipt = await this.submit(command);
    if (closing) {
      // Closing revokes runtime access. Return the same acknowledgement as the
      // high-level exit/refund/complete helpers; never poll a closed run.
      if (receipt.state === 'failed' || (command.action === 'complete' && receipt.state !== 'done'))
        throw new ExternalOperationError('Завершение команды не подтверждено', 'failed', {
          requestId: command.request_id,
        });
      return receipt as T;
    }
    return this.poll(
      (state) => {
        const item = state.commands.find((c) => c.requestId === command.request_id);
        if (item?.state === 'done') return item.result as T;
        if (item && item.state !== 'pending')
          throw new ExternalOperationError(
            (item.result as { error?: string })?.error ?? item.state,
            'failed',
            { requestId: command.request_id },
          );
      },
      timeoutMs,
      { requestId: command.request_id },
    );
  }
  async upload(jpeg: Blob, requestId: string): Promise<{ photoId: string; url: string }> {
    const response = await this.fetcher(API + '/result', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'image/jpeg', 'X-Request-Id': requestId },
      body: jpeg,
      signal: AbortSignal.timeout(30_000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    return data as { photoId: string; url: string };
  }
  previewUrl(camera: ExternalCameraId = 'main'): string {
    return camera === 'main' ? API + '/preview' : API + '/preview/' + encodeURIComponent(camera);
  }
  photoUrl(photoId: string): string {
    return API + '/photos/' + encodeURIComponent(photoId);
  }
}
