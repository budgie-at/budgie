import { isDefined, isNumber } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncError } from '../../core/error/sync.error';

const RAW_IP_WEIGHT_CEILING = 3000;
const SAPI_IP_WEIGHT_CEILING = 6000;
const SAPI_UID_WEIGHT_CEILING = 90000;
const COOL_DOWN_THRESHOLD_RATIO = 0.8;
const WEIGHT_WINDOW_MS = 60000;
const REQUEST_RATE_WINDOW_MS = 60000;
const REQUEST_RATE_CEILING = 1000;
const REQUEST_RATE_PACING_MS = 1000;

const RAW_IP_WEIGHT_HEADER = 'x-mbx-used-weight-1m';
const SAPI_IP_WEIGHT_HEADER = 'x-sapi-used-ip-weight-1m';
const SAPI_UID_WEIGHT_HEADER = 'x-sapi-used-uid-weight-1m';

export class BinanceWeightThrottle {
    private rawIpWeight = 0;
    private sapiIpWeight = 0;
    private sapiUidWeight = 0;
    private requestTimestamps: number[] = [];

    constructor(private readonly deadlineAtMs = Number.POSITIVE_INFINITY) {}

    recordHeaders(headers: Headers): void {
        this.rawIpWeight = this.readWeight(headers, RAW_IP_WEIGHT_HEADER, this.rawIpWeight);
        this.sapiIpWeight = this.readWeight(headers, SAPI_IP_WEIGHT_HEADER, this.sapiIpWeight);
        this.sapiUidWeight = this.readWeight(headers, SAPI_UID_WEIGHT_HEADER, this.sapiUidWeight);
    }

    async waitIfNeeded(): Promise<void> {
        if (this.shouldCoolDown()) {
            if (Date.now() + WEIGHT_WINDOW_MS >= this.deadlineAtMs) {
                throw SyncError.rateLimited(SyncProviderEnum.BINANCE);
            }

            await this.coolDown();
            this.reset();
        }

        await this.paceRequestRate();
        this.requestTimestamps.push(Date.now());
    }

    private async paceRequestRate(): Promise<void> {
        const windowStart = Date.now() - REQUEST_RATE_WINDOW_MS;
        this.requestTimestamps = this.requestTimestamps.filter(timestamp => timestamp > windowStart);

        if (this.requestTimestamps.length >= REQUEST_RATE_CEILING) {
            await this.delay(REQUEST_RATE_PACING_MS);
        }
    }

    private async delay(durationMs: number): Promise<void> {
        await new Promise<void>(resolve => {
            setTimeout(resolve, durationMs);
        });
    }

    private shouldCoolDown(): boolean {
        const rawIpExceeded = this.rawIpWeight >= RAW_IP_WEIGHT_CEILING * COOL_DOWN_THRESHOLD_RATIO;
        const sapiIpExceeded = this.sapiIpWeight >= SAPI_IP_WEIGHT_CEILING * COOL_DOWN_THRESHOLD_RATIO;
        const sapiUidExceeded = this.sapiUidWeight >= SAPI_UID_WEIGHT_CEILING * COOL_DOWN_THRESHOLD_RATIO;

        return rawIpExceeded || sapiIpExceeded || sapiUidExceeded;
    }

    private async coolDown(): Promise<void> {
        await this.delay(WEIGHT_WINDOW_MS);
    }

    private reset(): void {
        this.rawIpWeight = 0;
        this.sapiIpWeight = 0;
        this.sapiUidWeight = 0;
    }

    private readWeight(headers: Headers, headerName: string, fallback: number): number {
        const rawValue = headers.get(headerName);
        if (!isDefined(rawValue)) {
            return fallback;
        }

        const parsed = Number.parseInt(rawValue, 10);

        return isNumber(parsed) && !Number.isNaN(parsed) ? parsed : fallback;
    }
}
