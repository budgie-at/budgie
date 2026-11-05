import type { EnableBankingClient } from '../client/enable-banking.client';

export interface EnableBankingBatchContextInterface {
    readonly client: EnableBankingClient;
    readonly accountUid: string;
    readonly hash: string;
    readonly currencyCode: string;
    readonly fetchStartedAt: Date;
}
