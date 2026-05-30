import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { BaseBankSyncService } from '../../core/service/base-bank-sync.service';
import { MonobankClient } from '../client/monobank.client';
import { MONOBANK_MAX_PERIOD_SECONDS } from '../constant/monobank-max-period-seconds.constant';
import { MONOBANK_RATE_LIMIT_MS } from '../constant/monobank-rate-limit-ms.constant';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';

export class MonobankSyncService extends BaseBankSyncService {
    private static readonly DORMANCY_MONTHS = 3;

    private readonly monobankClient: MonobankClient;

    constructor(token: string) {
        const client = new MonobankClient(token);
        super(client, {
            maxPeriodSeconds: MONOBANK_MAX_PERIOD_SECONDS,
            rateLimitMs: MONOBANK_RATE_LIMIT_MS,
            dormancyMonths: MonobankSyncService.DORMANCY_MONTHS
        });
        this.monobankClient = client;
    }

    @Log('enter', jars => `done count=${jars.length}`, error => `throw error=${getErrorMessage(error)}`)
    async syncJars(): Promise<BankAccountInterface[]> {
        const result = await this.monobankClient.getJars();

        if (result.success) {
            return result.data;
        }

        throw new Error(`Failed to fetch jars: ${result.error.code} ${result.error.message}`);
    }
}
