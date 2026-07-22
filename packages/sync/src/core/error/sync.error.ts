import { SyncErrorCodeEnum } from '../enum/sync-error-code.enum';

import type { SyncProviderEnum } from '../enum/sync-provider.enum';
import type { SyncErrorInterface } from '../interface/sync-error.interface';

export class SyncError extends Error implements SyncErrorInterface {
    readonly code: SyncErrorCodeEnum;
    readonly provider: SyncProviderEnum;
    readonly originalError?: unknown;

    constructor(code: SyncErrorCodeEnum, message: string, provider: SyncProviderEnum, originalError?: unknown) {
        super(message);
        this.name = 'SyncError';
        this.code = code;
        this.provider = provider;
        this.originalError = originalError;
    }

    static from(error: SyncErrorInterface): SyncError {
        return error instanceof SyncError ? error : new SyncError(error.code, error.message, error.provider, error.originalError);
    }

    static unauthorized(provider: SyncProviderEnum, originalError?: unknown): SyncError {
        return new SyncError(SyncErrorCodeEnum.UNAUTHORIZED, 'Unauthorized access', provider, originalError);
    }

    static rateLimited(provider: SyncProviderEnum, originalError?: unknown): SyncError {
        return new SyncError(SyncErrorCodeEnum.RATE_LIMITED, 'Rate limit exceeded', provider, originalError);
    }

    static networkError(provider: SyncProviderEnum, originalError?: unknown): SyncError {
        return new SyncError(SyncErrorCodeEnum.NETWORK_ERROR, 'Network error occurred', provider, originalError);
    }

    static invalidResponse(provider: SyncProviderEnum, originalError?: unknown): SyncError {
        return new SyncError(SyncErrorCodeEnum.INVALID_RESPONSE, 'Invalid API response', provider, originalError);
    }
}
