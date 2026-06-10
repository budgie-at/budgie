import { BaseSyncService } from '../../core/service/base-sync.service';
import { BinanceSignedClient } from '../client/binance-signed.client';
import { BINANCE_MAX_PERIOD_SECONDS } from '../constant/binance-max-period-seconds.constant';
import { BINANCE_RATE_LIMIT_MS } from '../constant/binance-rate-limit-ms.constant';

export class BinanceSyncService extends BaseSyncService {
    private static readonly DORMANCY_MONTHS = 3;

    constructor(token: string) {
        const client = new BinanceSignedClient(token);
        super(client, {
            maxPeriodSeconds: BINANCE_MAX_PERIOD_SECONDS,
            rateLimitMs: BINANCE_RATE_LIMIT_MS,
            dormancyMonths: BinanceSyncService.DORMANCY_MONTHS
        });
    }
}
