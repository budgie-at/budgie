import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';

import { isDefined } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncDeferredError } from '../../core/error/sync-deferred.error';

import type { BinanceWeightCostInterface } from '../interface/binance-weight-cost.interface';
import type * as Headers from 'effect/http/Headers';

const WEIGHT_WINDOW_MS = 60000;
const SPOT_BUDGET_KEY = 'spot';
const SPOT_PATH_PREFIX = '/api/';

export class BinanceWeightThrottle {
    private static readonly SPOT_IP = { ceiling: 6000, header: 'x-mbx-used-weight-1m' } as const;
    private static readonly SAPI_IP = { ceiling: 12000, header: 'x-sapi-used-ip-weight-1m' } as const;
    private static readonly SAPI_UID = { ceiling: 180000, header: 'x-sapi-used-uid-weight-1m' } as const;

    private static readonly COSTS: ReadonlyMap<string, BinanceWeightCostInterface> = new Map([
        ['/api/v3/myTrades', { ...BinanceWeightThrottle.SPOT_IP, weight: 20 }],
        ['/api/v3/account', { ...BinanceWeightThrottle.SPOT_IP, weight: 20 }],
        ['/api/v3/exchangeInfo', { ...BinanceWeightThrottle.SPOT_IP, weight: 20 }],
        ['/sapi/v1/fiat/orders', { ...BinanceWeightThrottle.SAPI_UID, weight: 45000 }],
        ['/sapi/v1/capital/withdraw/history', { ...BinanceWeightThrottle.SAPI_UID, weight: 18000 }],
        ['/sapi/v1/convert/tradeFlow', { ...BinanceWeightThrottle.SAPI_UID, weight: 3000 }],
        ['/sapi/v1/simple-earn/flexible/history/rewardsRecord', { ...BinanceWeightThrottle.SAPI_IP, weight: 150 }],
        ['/sapi/v1/simple-earn/locked/history/rewardsRecord', { ...BinanceWeightThrottle.SAPI_IP, weight: 150 }],
        ['/sapi/v1/eth-staking/eth/history/rewardsHistory', { ...BinanceWeightThrottle.SAPI_IP, weight: 150 }],
        ['/sapi/v1/sol-staking/sol/history/rewardsHistory', { ...BinanceWeightThrottle.SAPI_IP, weight: 150 }],
        ['/sapi/v1/asset/assetDividend', { ...BinanceWeightThrottle.SAPI_IP, weight: 10 }]
    ]);

    readonly waitIfNeeded = Effect.fn('BinanceWeightThrottle.waitIfNeeded')(
        function* (this: BinanceWeightThrottle, endpoint: string) {
            const retryAfterRemainingMs = this.retryAfterUntilMs - (yield* Clock.currentTimeMillis);
            if (retryAfterRemainingMs > 0) {
                yield* this.sleepWithinDeadline(retryAfterRemainingMs, 'Retry-After back-off exceeds deadline');
            }

            const path = this.toPath(endpoint);
            const key = this.toBudgetKey(path);
            const { ceiling, weight } = this.toCost(path);
            const now = yield* Clock.currentTimeMillis;

            this.rollWindow(key, now);

            if ((this.usedByKey.get(key) ?? 0) + weight > ceiling) {
                const windowEndMs = (this.windowStartByKey.get(key) ?? now) + WEIGHT_WINDOW_MS;
                yield* this.sleepWithinDeadline(windowEndMs - now, 'Weight window reset exceeds deadline');
                this.rollWindow(key, yield* Clock.currentTimeMillis);
            }

            this.usedByKey.set(key, (this.usedByKey.get(key) ?? 0) + weight);
        },
        effect => this.semaphore.withPermit(effect)
    );

    readonly coolDownFor = Effect.fnUntraced(function* (this: BinanceWeightThrottle, retryAfterMs: number) {
        this.retryAfterUntilMs = Math.max(this.retryAfterUntilMs, (yield* Clock.currentTimeMillis) + retryAfterMs);
    });

    private readonly sleepWithinDeadline = Effect.fnUntraced(function* (this: BinanceWeightThrottle, durationMs: number, message: string) {
        if ((yield* Clock.currentTimeMillis) + durationMs >= this.deadlineAtMs) {
            return yield* new SyncDeferredError({ provider: SyncProviderEnum.BINANCE, message });
        }

        yield* Effect.sleep(durationMs);
    });

    private readonly usedByKey = new Map<string, number>();
    private readonly windowStartByKey = new Map<string, number>();
    private retryAfterUntilMs = 0;
    private readonly semaphore = Semaphore.makeUnsafe(1);

    constructor(private readonly deadlineAtMs: number) {}

    recordHeaders(endpoint: string, headers: Headers.Headers): void {
        const path = this.toPath(endpoint);
        const key = this.toBudgetKey(path);
        const rawValue: string | undefined = headers[this.toCost(path).header];
        const parsed = isDefined(rawValue) ? Number.parseInt(rawValue, 10) : Number.NaN;

        if (this.usedByKey.has(key) && !Number.isNaN(parsed)) {
            this.usedByKey.set(key, parsed);
        }
    }

    private rollWindow(key: string, now: number): void {
        const windowStartMs = this.windowStartByKey.get(key);

        if (!isDefined(windowStartMs) || now >= windowStartMs + WEIGHT_WINDOW_MS) {
            this.windowStartByKey.set(key, Math.floor(now / WEIGHT_WINDOW_MS) * WEIGHT_WINDOW_MS);
            this.usedByKey.set(key, 0);
        }
    }

    private toPath(endpoint: string): string {
        return endpoint.replace(/\?.*$/u, '');
    }

    private toBudgetKey(path: string): string {
        return path.startsWith(SPOT_PATH_PREFIX) ? SPOT_BUDGET_KEY : path;
    }

    private toCost(path: string): BinanceWeightCostInterface {
        const spotDefault = { ...BinanceWeightThrottle.SPOT_IP, weight: 1 };
        const sapiDefault = { ...BinanceWeightThrottle.SAPI_IP, weight: 1 };

        return BinanceWeightThrottle.COSTS.get(path) ?? (path.startsWith(SPOT_PATH_PREFIX) ? spotDefault : sapiDefault);
    }
}
