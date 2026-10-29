export interface paths {
    "/api/v1/external/runtime/activity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reset Idle */
        post: operations["reset_idle_api_v1_external_runtime_activity_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/assets/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Catalog Asset */
        get: operations["catalog_asset_api_v1_external_runtime_assets__key__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/cameras": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Cameras */
        get: operations["cameras_api_v1_external_runtime_cameras_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/commands": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Command */
        post: operations["command_api_v1_external_runtime_commands_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/context": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Context */
        get: operations["context_api_v1_external_runtime_context_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/effects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Effects */
        get: operations["effects_api_v1_external_runtime_effects_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/frames": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Frames */
        get: operations["frames_api_v1_external_runtime_frames_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/heartbeat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Heartbeat */
        post: operations["heartbeat_api_v1_external_runtime_heartbeat_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/photos/{photo_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Photo */
        get: operations["photo_api_v1_external_runtime_photos__photo_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Preview */
        get: operations["preview_api_v1_external_runtime_preview_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/preview/{camera}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Camera Preview */
        get: operations["camera_preview_api_v1_external_runtime_preview__camera__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Ready */
        post: operations["ready_api_v1_external_runtime_ready_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/result": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Result */
        post: operations["result_api_v1_external_runtime_result_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/share": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Share Result */
        get: operations["share_result_api_v1_external_runtime_share_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/share/qr": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Share Qr */
        get: operations["share_qr_api_v1_external_runtime_share_qr_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** State */
        get: operations["state_api_v1_external_runtime_state_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/external/runtime/telemetry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Telemetry */
        post: operations["telemetry_api_v1_external_runtime_telemetry_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** CapturePhotoResponse */
        CapturePhotoResponse: {
            /**
             * Belowminimum
             * @description Кадр меньше minimum_photo_pixels из настроек центра
             * @default null
             */
            belowMinimum: boolean | null;
            /**
             * Height
             * @default null
             */
            height: number | null;
            /**
             * Lens
             * @description Какой объектив просили
             * @default null
             */
            lens: ("main" | "ultrawide") | null;
            /**
             * Lensapplied
             * @description Камера переключила объектив (телефон); Canon и веб-камеры — false
             * @default false
             */
            lensApplied: boolean;
            /** Photoid */
            photoId: string;
            /** Takenat */
            takenAt: string;
            /**
             * Url
             * @description URL для загрузки фото с локального API
             */
            url: string;
            /**
             * Width
             * @default null
             */
            width: number | null;
        };
        /** Command */
        Command: {
            /**
             * Action
             * @enum {string}
             */
            action: "payment" | "capture" | "print" | "complete" | "cancel" | "extend" | "refund" | "share";
            /**
             * Amount
             * @description Сумма оплаты в рублях, до двух знаков после запятой; без неё — цена услуги из центра
             */
            amount?: number | null;
            /**
             * Camera
             * @default main
             * @enum {string}
             */
            camera: "main" | "top" | "side";
            /**
             * Copies
             * @default 1
             */
            copies: number;
            /**
             * Cut
             * @description Резка листа на две полоски 5×15 см (2×6 дюймов)
             * @default false
             */
            cut: boolean;
            /** Photo Id */
            photo_id?: string | null;
            /** Photo Ids */
            photo_ids?: string[];
            /** Request Id */
            request_id: string;
        };
        /** ErrorBody */
        ErrorBody: {
            /**
             * Code
             * @enum {string}
             */
            code: "validation_error" | "not_found" | "gone" | "unauthorized" | "forbidden" | "conflict" | "rate_limited" | "device_unavailable" | "device_busy" | "device_error" | "upstream_unavailable" | "operation_cancelled" | "operation_timeout" | "payment_declined" | "not_implemented" | "internal_error";
            /**
             * Details
             * @default null
             */
            details: {
                [key: string]: unknown;
            } | null;
            /** Message */
            message: string;
        };
        /** ErrorResponse */
        ErrorResponse: {
            error: components["schemas"]["ErrorBody"];
        };
        /** Command */
        ExternalAppCommand: {
            /**
             * Action
             * @enum {string}
             */
            action: "payment" | "capture" | "print" | "complete" | "cancel" | "extend" | "refund" | "share";
            /**
             * Amount
             * @description Сумма оплаты в рублях, до двух знаков после запятой; без неё — цена услуги из центра
             * @default null
             */
            amount: number | null;
            /**
             * Camera
             * @default main
             * @enum {string}
             */
            camera: "main" | "top" | "side";
            /**
             * Copies
             * @default 1
             */
            copies: number;
            /**
             * Cut
             * @description Резка листа на две полоски 5×15 см (2×6 дюймов)
             * @default false
             */
            cut: boolean;
            /**
             * Photo Id
             * @default null
             */
            photo_id: string | null;
            /** Photo Ids */
            photo_ids?: string[];
            /** Request Id */
            request_id: string;
        };
        /** Observation */
        ExternalAppObservation: {
            /** Data */
            data?: {
                [key: string]: string | number | boolean | null;
            };
            /**
             * Elapsed Ms
             * @description Момент события от начала запуска, мс; часы SDK согласованы через ready
             * @default null
             */
            elapsed_ms: number | null;
            /** Event Id */
            event_id: string;
            /**
             * Kind
             * @default event
             * @enum {string}
             */
            kind: "event" | "stage" | "error";
            /**
             * Message
             * @default
             */
            message: string;
            /** Name */
            name: string;
            /**
             * Stack
             * @default
             */
            stack: string;
        };
        /** ObservationBatch */
        ExternalAppObservationBatch: {
            /** Events */
            events: components["schemas"]["Observation"][];
        };
        /** ExternalCamera */
        ExternalCamera: {
            /**
             * Id
             * @enum {string}
             */
            id: "main" | "top" | "side";
            /** Label */
            label: string;
            /** Orientation */
            orientation: string;
            /** Ready */
            ready: boolean;
        };
        /** ExternalCamerasResponse */
        ExternalCamerasResponse: {
            /** Allowselection */
            allowSelection: boolean;
            /** Cameras */
            cameras: components["schemas"]["ExternalCamera"][];
            /** Capturemode */
            captureMode: string;
        };
        /** ExternalCommandReceipt */
        ExternalCommandReceipt: {
            /** Requestid */
            requestId: string;
            /** State */
            state: string;
        };
        /** ExternalCommandRecord */
        ExternalCommandRecord: {
            /** Requestid */
            requestId: string;
            /** Result */
            result?: unknown;
            /** State */
            state: string;
        };
        /** ExternalContextResponse */
        ExternalContextResponse: {
            /** Config */
            config: {
                [key: string]: unknown;
            };
            /**
             * Fulfillment
             * @enum {string}
             */
            fulfillment: "print" | "digital";
            /** Name */
            name: string;
            /** Permissions */
            permissions: ("capture:main" | "capture:secondary" | "payment" | "print" | "result:write" | "config:read")[];
            /**
             * Price
             * @description Цена услуги из центра, в рублях. Используйте для расчёта оплаты
             */
            price: number;
            /**
             * Protocol
             * @default 1
             * @constant
             */
            protocol: 1;
            /** Runid */
            runId: string;
            /** Sessionid */
            sessionId: string;
            /**
             * Sheetprice
             * @description Цена дополнительного листа из центра, в рублях. Используйте для расчёта доплаты
             */
            sheetPrice: number;
            /** Version */
            version: string;
        };
        /** ExternalEffect */
        ExternalEffect: {
            /** Cssfilter */
            cssFilter?: string | null;
            /** Id */
            id: number;
            /** Previewurl */
            previewUrl?: string | null;
            /** Title */
            title: string;
        };
        /** ExternalFrame */
        ExternalFrame: {
            /** Formatkey */
            formatKey?: string | null;
            /** Frameurl */
            frameUrl?: string | null;
            /** Id */
            id: number;
            /**
             * Isplain
             * @default false
             */
            isPlain: boolean;
            /** Largephotoframeurl */
            largePhotoFrameUrl?: string | null;
            layout?: components["schemas"]["ExternalFrameLayout"] | null;
            /** Previewurls */
            previewUrls?: string[];
            /** Printformat */
            printFormat?: string | null;
            /** Title */
            title: string;
        };
        /** ExternalFrameLayout */
        ExternalFrameLayout: {
            /** Framesperstrip */
            framesPerStrip?: number | null;
            /** Kind */
            kind?: string | null;
            /** Orientation */
            orientation?: string | null;
            /** Strips */
            strips?: number | null;
        };
        ExternalGatewayError: {
            error: string | {
                code?: string;
                message?: string;
            };
        };
        /** ExternalPayment */
        ExternalPayment: {
            /**
             * Amountdue
             * @description Сумма к оплате, рубли
             */
            amountDue: number;
            /**
             * Amountpaid
             * @description Принято денег, рубли
             */
            amountPaid: number;
            /** Error */
            error?: string | null;
            /** Fiscalqr */
            fiscalQr?: string | null;
            /** Method */
            method?: string | null;
            /** Operationid */
            operationId: string;
            /**
             * Refundamount
             * @description Сумма возврата, рубли
             */
            refundAmount?: number | null;
            /** Refundmessage */
            refundMessage?: string | null;
            /** Refundstatus */
            refundStatus?: string | null;
            /** Remainingseconds */
            remainingSeconds?: number | null;
            /** Status */
            status: string;
        };
        /** ExternalShareResult */
        ExternalShareResult: {
            /** Downloadurl */
            downloadUrl: string;
            /** Expiresat */
            expiresAt: string;
            /** Photoscount */
            photosCount: number;
            /** Qrurl */
            qrUrl: string;
        };
        /** ExternalStateResponse */
        ExternalStateResponse: {
            /** Commands */
            commands: components["schemas"]["ExternalCommandRecord"][];
            /** Paid */
            paid: boolean;
            /** Payments */
            payments: components["schemas"]["ExternalPayment"][];
            /** Photos */
            photos: components["schemas"]["SessionPhoto"][];
            /** Printjobs */
            printJobs: components["schemas"]["SessionPrintJob"][];
            /** Runid */
            runId: string;
            /** Sessionid */
            sessionId: string;
            /** State */
            state: string;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** Observation */
        Observation: {
            /** Data */
            data?: {
                [key: string]: string | number | boolean | null;
            };
            /**
             * Elapsed Ms
             * @description Момент события от начала запуска, мс; часы SDK согласованы через ready
             */
            elapsed_ms?: number | null;
            /** Event Id */
            event_id: string;
            /**
             * Kind
             * @default event
             * @enum {string}
             */
            kind: "event" | "stage" | "error";
            /**
             * Message
             * @default
             */
            message: string;
            /** Name */
            name: string;
            /**
             * Stack
             * @default
             */
            stack: string;
        };
        /** ObservationBatch */
        ObservationBatch: {
            /** Events */
            events: components["schemas"]["Observation"][];
        };
        /** PrintJobResponse */
        PrintJobResponse: {
            /** Jobid */
            jobId: string;
            /** Phase */
            phase: string;
        };
        /** SessionPhoto */
        SessionPhoto: {
            /** Createdat */
            createdAt: string;
            /**
             * Kind
             * @enum {string}
             */
            kind: "shot" | "print";
            /** Photoid */
            photoId: string;
            /** Url */
            url: string;
        };
        /** SessionPrintJob */
        SessionPrintJob: {
            /** Copies */
            copies: number;
            /** Copiesdone */
            copiesDone: number;
            /** Error */
            error?: string | null;
            /** Jobid */
            jobId: string;
            /** Phase */
            phase: string;
        };
        /** ValidationError */
        ValidationError: {
            /** Context */
            ctx?: Record<string, never>;
            /** Input */
            input?: unknown;
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    reset_idle_api_v1_external_runtime_activity_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ok: boolean;
                    };
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    catalog_asset_api_v1_external_runtime_assets__key__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    cameras_api_v1_external_runtime_cameras_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExternalCamerasResponse"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    command_api_v1_external_runtime_commands_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Command"];
            };
        };
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExternalCommandReceipt"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    context_api_v1_external_runtime_context_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExternalContextResponse"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    effects_api_v1_external_runtime_effects_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExternalEffect"][];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    frames_api_v1_external_runtime_frames_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExternalFrame"][];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    heartbeat_api_v1_external_runtime_heartbeat_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ok: boolean;
                    };
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    photo_api_v1_external_runtime_photos__photo_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                photo_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "image/jpeg": string;
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    preview_api_v1_external_runtime_preview_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "multipart/x-mixed-replace": string;
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    camera_preview_api_v1_external_runtime_preview__camera__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                camera: "main" | "top" | "side";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "multipart/x-mixed-replace": string;
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    ready_api_v1_external_runtime_ready_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        elapsedMs: number;
                        ok: boolean;
                    };
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    result_api_v1_external_runtime_result_post: {
        parameters: {
            query?: never;
            header: {
                "X-Request-Id": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "image/jpeg": string;
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        height: number;
                        photoId: string;
                        url: string;
                        width: number;
                    };
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    share_result_api_v1_external_runtime_share_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExternalShareResult"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    share_qr_api_v1_external_runtime_share_qr_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "image/png": string;
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    state_api_v1_external_runtime_state_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExternalStateResponse"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
    telemetry_api_v1_external_runtime_telemetry_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ObservationBatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        accepted: number;
                        duplicates: number;
                    };
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            408: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
            /** @description Backend/gateway error; SDK error mapping is documented in API.md */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"] | components["schemas"]["ExternalGatewayError"];
                };
            };
        };
    };
}
