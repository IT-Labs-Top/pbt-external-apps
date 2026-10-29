/** Isolated browser client. The app chooses prices; the backend executes and journals operations. */
import type { CapturePhotoResponse, ExternalAppCommand, ExternalAppObservation, ExternalCommandReceipt, ExternalContextResponse, ExternalCamerasResponse, ExternalEffect, ExternalFrame, ExternalStateResponse, ExternalShareResult } from './types.js';
declare global {
    interface Window {
        pbtService?: {
            readonly protocol: 1;
            requestExit?(): Promise<void>;
            onLifecycle(handler: (event: 'start' | 'pause' | 'resume' | 'stop') => void): () => void;
        };
    }
}
type CommandDefaults = 'copies' | 'photo_id' | 'photo_ids' | 'amount' | 'camera' | 'cut';
export type ExternalCommand = Omit<ExternalAppCommand, CommandDefaults> & Partial<Pick<ExternalAppCommand, CommandDefaults>>;
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
export declare class ExternalOperationError extends Error {
    readonly code: 'timeout' | 'transport' | 'failed';
    readonly requestId?: string;
    readonly operationId?: string;
    readonly jobId?: string;
    readonly result?: ExternalPayment | ExternalPrintJob;
    constructor(message: string, code: 'timeout' | 'transport' | 'failed', details?: OperationDetails);
}
export type ExternalObservation = Pick<ExternalAppObservation, 'event_id' | 'name'> & Partial<Omit<ExternalAppObservation, 'event_id' | 'name'>>;
type EventData = Record<string, string | number | boolean | null>;
export declare class ExternalClient {
    #private;
    private readonly fetcher;
    constructor(fetcher?: typeof fetch);
    private call;
    context(): Promise<ExternalContext>;
    /** Enabled frames from this service, or the terminal catalog when no private list is assigned. */
    frames(): Promise<ExternalFrame[]>;
    /** CSS filters and cached preview images configured in the administration panel. Requires config:read. */
    effects(): Promise<ExternalEffect[]>;
    cameras(): Promise<ExternalCamerasResponse>;
    /** Explicit application activity; automatic heartbeats still do not postpone standby. */
    resetIdleTimer(): Promise<void>;
    state(): Promise<ExternalState>;
    ready(): Promise<void>;
    dispose(): void;
    get diagnosticsDropped(): number;
    /** Logical events only: never pass photographs, credentials or customer data. */
    track(name: string, data?: EventData): void;
    stage(name: string): void;
    logError(error: unknown, data?: EventData, name?: string): void;
    private observe;
    /** Best effort; retries keep event IDs and cannot repeat physical/financial operations. */
    flushTelemetry(): Promise<void>;
    private sendTelemetry;
    submit(command: ExternalCommand): Promise<ExternalCommandReceipt>;
    /** Amounts in this API, including progress and results, are in rubles. */
    payment(amount?: number, options?: ExternalPaymentOptions): Promise<ExternalPayment>;
    /** Extend the current partial cash payment; returns its updated state without creating another payment. */
    extendCashWait(options?: ExternalOperationOptions): Promise<ExternalPayment>;
    /** Request the backend's refund policy and close the run. The receipt is not a bank refund confirmation. */
    requestRefund(options?: Pick<ExternalOperationOptions, 'requestId'>): Promise<ExternalCommandReceipt>;
    /** Resume waiting for this exact payment; does not create another charge. */
    waitPayment(operationId: string, options?: ExternalPaymentOptions): Promise<ExternalPayment>;
    capture(options?: ExternalOperationOptions & {
        camera?: ExternalCameraId;
    }): Promise<ExternalPhoto>;
    /** Publish the final selection. Show qrUrl before complete(); retries reuse the same requestId. */
    share(photoIds: string[], options?: ExternalOperationOptions): Promise<ExternalShare>;
    /** Read the prepared link without uploading or creating another gallery. */
    sharedPhotos(): Promise<ExternalShare>;
    print(photoId: string, copies?: number, options?: ExternalPrintOptions): Promise<ExternalPrintJob>;
    /** Resume waiting for this exact job; never submits another print job. */
    waitPrint(jobId: string, options?: ExternalPrintOptions): Promise<ExternalPrintJob>;
    /** The backend confirms completion in the response, before the shell closes this view. */
    complete(options?: Pick<ExternalOperationOptions, 'requestId'>): Promise<ExternalCommandReceipt>;
    private progress;
    private poll;
    /** Open the shell's confirmation. Resolution means shown, not visitor approval. */
    requestExit(): Promise<void>;
    /** Voluntary exit without a dialog. Default retries reuse the same cancellation ID. */
    exit(requestId?: string): Promise<ExternalCommandReceipt>;
    /** A retry MUST reuse this request_id and identical arguments. A new ID is a new operation. */
    command<T = unknown>(command: ExternalCommand, timeoutMs?: number): Promise<T>;
    upload(jpeg: Blob, requestId: string): Promise<{
        photoId: string;
        url: string;
    }>;
    previewUrl(camera?: ExternalCameraId): string;
    photoUrl(photoId: string): string;
}
