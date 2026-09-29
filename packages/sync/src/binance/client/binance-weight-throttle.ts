import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';

import { isDefined } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncDeferredError } from '../../core/error/sync-deferred.error';

import type * as Headers from 'effect/http/Headers';

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
    readonly waitIfNeeded = Effect.fn('BinanceWeightThrottle.waitIfNeeded')(
        function* (this: BinanceWeightThrottle) {
            if (this.shouldCoolDown()) {
                if (Date.now() + WEIGHT_WINDOW_MS >= this.deadlineAtMs) {
                    yield* new SyncDeferredError({
                        provider: SyncProviderEnum.BINANCE,
                        message: 'Weight cool-down exceeds deadline'
                    });
                }

                yield* Effect.sleep(WEIGHT_WINDOW_MS);
                this.rawIpWeight = 0;
                this.sapiIpWeight = 0;
                this.sapiUidWeight = 0;
            }

            const windowStart = Date.now() - REQUEST_RATE_WINDOW_MS;
            this.requestTimestamps = this.requestTimestamps.filter(timestamp => timestamp > windowStart);

            if (this.requestTimestamps.length >= REQUEST_RATE_CEILING) {
                yield* Effect.sleep(REQUEST_RATE_PACING_MS);
            }

            this.requestTimestamps.push(Date.now());
        },
        effect => this.semaphore.withPermit(effect)
    );

    private rawIpWeight = 0;
    private sapiIpWeight = 0;
    private sapiUidWeight = 0;
    private requestTimestamps: number[] = [];
    private readonly semaphore = Semaphore.makeUnsafe(1);

    constructor(private readonly deadlineAtMs: number) {}

    recordHeaders(headers: Headers.Headers): void {
        this.rawIpWeight = this.readWeight(headers, RAW_IP_WEIGHT_HEADER, this.rawIpWeight);
        this.sapiIpWeight = this.readWeight(headers, SAPI_IP_WEIGHT_HEADER, this.sapiIpWeight);
        this.sapiUidWeight = this.readWeight(headers, SAPI_UID_WEIGHT_HEADER, this.sapiUidWeight);
    }

    private shouldCoolDown(): boolean {
        const rawIpExceeded = this.rawIpWeight >= RAW_IP_WEIGHT_CEILING * COOL_DOWN_THRESHOLD_RATIO;
        const sapiIpExceeded = this.sapiIpWeight >= SAPI_IP_WEIGHT_CEILING * COOL_DOWN_THRESHOLD_RATIO;
        const sapiUidExceeded = this.sapiUidWeight >= SAPI_UID_WEIGHT_CEILING * COOL_DOWN_THRESHOLD_RATIO;

        return rawIpExceeded || sapiIpExceeded || sapiUidExceeded;
    }

    private readWeight(headers: Headers.Headers, headerName: string, fallback: number): number {
        const rawValue: string | undefined = headers[headerName];
        const parsed = isDefined(rawValue) ? Number.parseInt(rawValue, 10) : Number.NaN;

        return Number.isNaN(parsed) ? fallback : parsed;
    }
}
