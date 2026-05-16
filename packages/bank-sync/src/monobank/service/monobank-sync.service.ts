import { BaseBankSyncService } from '../../core/service/base-bank-sync.service';
import { MonobankClient } from '../client/monobank.client';
import { MONOBANK_MAX_PERIOD_SECONDS } from '../constant/monobank-max-period-seconds.constant';
import { MONOBANK_RATE_LIMIT_MS } from '../constant/monobank-rate-limit-ms.constant';

const MONOBANK_DORMANCY_MONTHS = 6;

export class MonobankSyncService extends BaseBankSyncService {
    constructor(token: string) {
        super(new MonobankClient(token), {
            maxPeriodSeconds: MONOBANK_MAX_PERIOD_SECONDS,
            rateLimitMs: MONOBANK_RATE_LIMIT_MS,
            dormancyMonths: MONOBANK_DORMANCY_MONTHS
        });
    }
}
