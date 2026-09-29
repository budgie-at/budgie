import { BaseSyncService } from '../../core/service/base-sync.service';
import { MONOBANK_MAX_PERIOD_SECONDS } from '../constant/monobank-max-period-seconds.constant';
import { MONOBANK_RATE_LIMIT_MS } from '../constant/monobank-rate-limit-ms.constant';

import type { MonobankClient } from '../client/monobank.client';

export class MonobankSyncService extends BaseSyncService {
    private static readonly DORMANCY_MONTHS = 3;

    constructor(client: MonobankClient) {
        super(client, {
            maxPeriodSeconds: MONOBANK_MAX_PERIOD_SECONDS,
            rateLimitMs: MONOBANK_RATE_LIMIT_MS,
            dormancyMonths: MonobankSyncService.DORMANCY_MONTHS
        });
    }
}
