const API = '/api/v1/external/runtime';
export class ExternalOperationError extends Error {
    code;
    requestId;
    operationId;
    jobId;
    result;
    constructor(message, code, details = {}) {
        super(message);
        this.code = code;
        this.name = 'ExternalOperationError';
        this.requestId = details.requestId;
        this.operationId = details.operationId;
        this.jobId = details.jobId;
        this.result = details.result;
    }
}
export class ExternalClient {
    fetcher;
    #exitRequestId;
    #refundRequestId;
    #heartbeat;
    #telemetryTimer;
    #pending = [];
    #sending;
    #telemetryDisabled = false;
    #failures = 0;
    #dropped = 0;
    #removeErrors;
    #telemetryClock;
    constructor(fetcher = (input, init) => fetch(input, init)) {
        this.fetcher = fetcher;
    }
    async call(path, body, timeoutMs = 15_000) {
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
        return data;
    }
    context() {
        return this.call('/context');
    }
    /** Enabled frames from this service, or the terminal catalog when no private list is assigned. */
    frames() {
        return this.call('/frames');
    }
    /** CSS filters and cached preview images configured in the administration panel. Requires config:read. */
    effects() {
        return this.call('/effects');
    }
    cameras() {
        return this.call('/cameras');
    }
    /** Explicit application activity; automatic heartbeats still do not postpone standby. */
    async resetIdleTimer() {
        await this.call('/activity', {});
    }
    state() {
        return this.call('/state');
    }
    async ready() {
        const ready = await this.call('/ready', {});
        // Anchor once per client. Repeated ready() calls must not shift queued timestamps.
        // Older backends omit elapsedMs, so keep sending their original observation shape.
        if (!this.#telemetryClock && Number.isSafeInteger(ready.elapsedMs) && ready.elapsedMs >= 0) {
            this.#telemetryClock = { elapsedMs: ready.elapsedMs, localMs: performance.now() };
        }
        this.dispose();
        this.#heartbeat = setInterval(() => {
            void this.call('/heartbeat', {}).catch(() => undefined);
        }, 5000);
        this.#telemetryTimer = setInterval(() => {
            void this.flushTelemetry();
        }, 2000);
        if (typeof window !== 'undefined') {
            const error = (event) => this.logError(event.error ?? event.message, {
                line: event.lineno || 0,
                column: event.colno || 0,
            }, 'javascript.error');
            const rejected = (event) => this.logError(event.reason, {}, 'promise.rejection');
            window.addEventListener('error', error);
            window.addEventListener('unhandledrejection', rejected);
            this.#removeErrors = () => {
                window.removeEventListener('error', error);
                window.removeEventListener('unhandledrejection', rejected);
            };
        }
    }
    dispose() {
        if (this.#heartbeat)
            clearInterval(this.#heartbeat);
        this.#heartbeat = undefined;
        if (this.#telemetryTimer)
            clearInterval(this.#telemetryTimer);
        this.#telemetryTimer = undefined;
        this.#removeErrors?.();
        this.#removeErrors = undefined;
        void this.flushTelemetry();
    }
    get diagnosticsDropped() {
        return this.#dropped;
    }
    /** Logical events only: never pass photographs, credentials or customer data. */
    track(name, data = {}) {
        try {
            this.observe({ name, kind: 'event', data });
        }
        catch {
            this.#dropped++;
        }
    }
    stage(name) {
        try {
            this.observe({ name, kind: 'stage' });
        }
        catch {
            this.#dropped++;
        }
    }
    logError(error, data = {}, name = 'application.error') {
        try {
            this.observe({
                name,
                kind: 'error',
                data,
                message: (error instanceof Error ? error.message : String(error)).slice(0, 500),
                stack: error instanceof Error ? (error.stack?.slice(0, 1000) ?? '') : '',
            });
        }
        catch {
            /* Observability cannot break the service. */
        }
    }
    observe(value) {
        if (this.#telemetryDisabled || !/^[a-z][a-z0-9_.-]{0,47}$/.test(value.name))
            return;
        if (this.#pending.length >= 32) {
            this.#dropped++;
            return;
        }
        const data = {};
        for (const [key, item] of Object.entries(value.data ?? {}).slice(0, 10)) {
            if (!/^[a-z][a-z0-9_.-]{0,39}$/.test(key))
                continue;
            if (item !== null && !['string', 'number', 'boolean'].includes(typeof item))
                continue;
            if (typeof item === 'number' && (!Number.isFinite(item) || Math.abs(item) > 1e12))
                continue;
            data[key] = typeof item === 'string' ? item.slice(0, 160) : item;
        }
        const clock = this.#telemetryClock;
        const timestamp = clock
            ? { elapsed_ms: Math.floor(clock.elapsedMs + Math.max(0, performance.now() - clock.localMs)) }
            : {};
        this.#pending.push({ ...value, data, ...timestamp, event_id: crypto.randomUUID() });
    }
    /** Best effort; retries keep event IDs and cannot repeat physical/financial operations. */
    flushTelemetry() {
        if (this.#sending)
            return this.#sending;
        if (!this.#pending.length || this.#telemetryDisabled)
            return Promise.resolve();
        this.#sending = this.sendTelemetry().finally(() => {
            this.#sending = undefined;
        });
        return this.#sending;
    }
    async sendTelemetry() {
        if (!this.#pending.length || this.#telemetryDisabled)
            return;
        const batch = [];
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
            if (!response.ok)
                throw new Error('Telemetry unavailable');
            this.#pending.splice(0, batch.length);
            this.#failures = 0;
        }
        catch {
            if (++this.#failures >= 3) {
                this.#pending.splice(0, batch.length);
                this.#dropped += batch.length;
                this.#failures = 0;
            }
        }
    }
    async submit(command) {
        try {
            return await this.call('/commands', command);
        }
        catch (error) {
            throw new ExternalOperationError(String(error), 'transport', {
                requestId: command.request_id,
            });
        }
    }
    /** Amounts in this API, including progress and results, are in rubles. */
    async payment(amount, options = {}) {
        const requestId = options.requestId ?? crypto.randomUUID();
        if (amount !== undefined) {
            const cents = amount * 100;
            if (!Number.isFinite(amount) ||
                amount <= 0 ||
                amount > 1_000_000 ||
                Math.abs(cents - Math.round(cents)) > 1e-7)
                throw new ExternalOperationError('Укажите сумму в рублях с точностью до копейки', 'failed', { requestId });
            // Remove only binary floating-point noise (e.g. 0.1 + 0.2), never round a sub-kopeck price.
            amount = Math.round(cents) / 100;
        }
        const timeoutMs = options.timeoutMs ?? 600_000;
        const started = performance.now();
        const payment = await this.command({ request_id: requestId, action: 'payment', ...(amount === undefined ? {} : { amount }) }, timeoutMs);
        return this.waitPayment(payment.operationId, {
            ...options,
            requestId,
            timeoutMs: Math.max(0, timeoutMs - (performance.now() - started)),
        });
    }
    /** Extend the current partial cash payment; returns its updated state without creating another payment. */
    extendCashWait(options = {}) {
        return this.command({ request_id: options.requestId ?? crypto.randomUUID(), action: 'extend' }, options.timeoutMs);
    }
    /** Request the backend's refund policy and close the run. The receipt is not a bank refund confirmation. */
    async requestRefund(options = {}) {
        const requestId = options.requestId ?? (this.#refundRequestId ??= crypto.randomUUID());
        await this.flushTelemetry();
        return this.submit({ request_id: requestId, action: 'refund' });
    }
    /** Resume waiting for this exact payment; does not create another charge. */
    waitPayment(operationId, options = {}) {
        const details = { requestId: options.requestId, operationId };
        return this.poll((state) => {
            const payment = state.payments.find((p) => p.operationId === operationId);
            if (!payment)
                return;
            this.progress(options.onProgress, payment);
            if (payment.status === 'completed' && payment.amountPaid >= payment.amountDue)
                return payment;
            if (payment.status !== 'pending')
                throw new ExternalOperationError(payment.error || 'Оплата не подтверждена', 'failed', {
                    ...details,
                    result: payment,
                });
        }, options.timeoutMs ?? 600_000, details);
    }
    capture(options = {}) {
        return this.command({
            request_id: options.requestId ?? crypto.randomUUID(),
            action: 'capture',
            ...(options.camera === undefined ? {} : { camera: options.camera }),
        }, options.timeoutMs);
    }
    /** Publish the final selection. Show qrUrl before complete(); retries reuse the same requestId. */
    share(photoIds, options = {}) {
        return this.command({
            request_id: options.requestId ?? crypto.randomUUID(),
            action: 'share',
            photo_ids: [...photoIds],
        }, options.timeoutMs ?? 600_000);
    }
    /** Read the prepared link without uploading or creating another gallery. */
    sharedPhotos() {
        return this.call('/share');
    }
    async print(photoId, copies = 1, options = {}) {
        const requestId = options.requestId ?? crypto.randomUUID();
        const timeoutMs = options.timeoutMs ?? 600_000;
        const started = performance.now();
        const job = await this.command({
            request_id: requestId,
            action: 'print',
            photo_id: photoId,
            copies,
            ...(options.cut === undefined ? {} : { cut: options.cut }),
        }, timeoutMs);
        return this.waitPrint(job.jobId, {
            ...options,
            requestId,
            timeoutMs: Math.max(0, timeoutMs - (performance.now() - started)),
        });
    }
    /** Resume waiting for this exact job; never submits another print job. */
    waitPrint(jobId, options = {}) {
        const details = { requestId: options.requestId, jobId };
        return this.poll((state) => {
            const job = state.printJobs.find((p) => p.jobId === jobId);
            if (!job)
                return;
            this.progress(options.onProgress, job);
            if (job.phase === 'done' && job.copiesDone === job.copies)
                return job;
            if (['done', 'failed', 'cancelled'].includes(job.phase))
                throw new ExternalOperationError(job.error || 'Выдача всех листов не подтверждена', 'failed', {
                    ...details,
                    result: job,
                });
        }, options.timeoutMs ?? 600_000, details);
    }
    /** The backend confirms completion in the response, before the shell closes this view. */
    async complete(options = {}) {
        await this.flushTelemetry();
        const requestId = options.requestId ?? crypto.randomUUID();
        const receipt = await this.submit({ request_id: requestId, action: 'complete' });
        if (receipt.state !== 'done')
            throw new ExternalOperationError('Завершение услуги не подтверждено', 'failed', {
                requestId,
            });
        return receipt;
    }
    progress(callback, value) {
        try {
            void Promise.resolve(callback?.(value)).catch((error) => this.logError(error));
        }
        catch (error) {
            this.logError(error);
        }
    }
    async poll(inspect, timeoutMs, details) {
        const deadline = performance.now() + timeoutMs;
        while (performance.now() < deadline) {
            let state;
            try {
                state = await this.call('/state', undefined, Math.min(15_000, Math.max(1, deadline - performance.now())));
            }
            catch (error) {
                throw new ExternalOperationError(String(error), 'transport', details);
            }
            const result = inspect(state);
            if (result !== undefined)
                return result;
            await new Promise((resolve) => setTimeout(resolve, Math.min(700, Math.max(0, deadline - performance.now()))));
        }
        throw new ExternalOperationError('Результат ещё не подтверждён. Продолжите ожидание этой же операции; новая команда повторит действие.', 'timeout', details);
    }
    /** Open the shell's confirmation. Resolution means shown, not visitor approval. */
    async requestExit() {
        const bridge = typeof window === 'undefined' ? undefined : window.pbtService;
        if (!bridge?.requestExit)
            throw new Error('Подтверждение выхода недоступно в этой версии оболочки');
        await bridge.requestExit();
    }
    /** Voluntary exit without a dialog. Default retries reuse the same cancellation ID. */
    async exit(requestId = (this.#exitRequestId ??= crypto.randomUUID())) {
        await this.flushTelemetry();
        return this.submit({ request_id: requestId, action: 'cancel' });
    }
    /** A retry MUST reuse this request_id and identical arguments. A new ID is a new operation. */
    async command(command, timeoutMs = 120_000) {
        const closing = ['complete', 'cancel', 'refund'].includes(command.action);
        if (closing)
            await this.flushTelemetry();
        const receipt = await this.submit(command);
        if (closing) {
            // Closing revokes runtime access. Return the same acknowledgement as the
            // high-level exit/refund/complete helpers; never poll a closed run.
            if (receipt.state === 'failed' || (command.action === 'complete' && receipt.state !== 'done'))
                throw new ExternalOperationError('Завершение команды не подтверждено', 'failed', {
                    requestId: command.request_id,
                });
            return receipt;
        }
        return this.poll((state) => {
            const item = state.commands.find((c) => c.requestId === command.request_id);
            if (item?.state === 'done')
                return item.result;
            if (item && item.state !== 'pending')
                throw new ExternalOperationError(item.result?.error ?? item.state, 'failed', { requestId: command.request_id });
        }, timeoutMs, { requestId: command.request_id });
    }
    async upload(jpeg, requestId) {
        const response = await this.fetcher(API + '/result', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'image/jpeg', 'X-Request-Id': requestId },
            body: jpeg,
            signal: AbortSignal.timeout(30_000),
        });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data.error?.message ?? `HTTP ${response.status}`);
        return data;
    }
    previewUrl(camera = 'main') {
        return camera === 'main' ? API + '/preview' : API + '/preview/' + encodeURIComponent(camera);
    }
    photoUrl(photoId) {
        return API + '/photos/' + encodeURIComponent(photoId);
    }
}
