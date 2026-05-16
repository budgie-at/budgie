import { addMonths } from 'date-fns';

import { BaseBankSyncService } from '../../core/service/base-bank-sync.service';
import { MonobankClient } from '../client/monobank.client';
import { MONOBANK_MAX_PERIOD_SECONDS } from '../constant/monobank-max-period-seconds.constant';
import { MONOBANK_RATE_LIMIT_MS } from '../constant/monobank-rate-limit-ms.constant';

export class MonobankSyncService extends BaseBankSyncService {
    constructor(token: string) {
        super(new MonobankClient(token), {
            maxPeriodSeconds: MONOBANK_MAX_PERIOD_SECONDS,
            rateLimitMs: MONOBANK_RATE_LIMIT_MS,
            historicalFloor: addMonths(new Date(), -6),
            maxEmptyWindowsBeforeStop: 3
        });
    }
}
