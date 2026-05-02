import { AccountEntityTable, BankSyncEntityTable, InstrumentEntityTable, MccCategoryEntityTable } from '@budgie/contracts';

import { insertOne } from './insert-one';

import type {
    AccountEntityInterface,
    BankSyncEntityInterface,
    InstrumentEntityInterface,
    MccCategoryEntityInterface
} from '@budgie/contracts';

interface AccountSeedInput {
    readonly title?: string;
    readonly type?: string;
    readonly nature?: string;
    readonly icon?: string;
    readonly instrumentId?: number;
    readonly externalId?: string | null;
    readonly externalSource?: string | null;
    readonly iban?: string | null;
}

interface BankSyncSeedInput {
    readonly accountId: number;
    readonly token?: string;
    readonly provider?: string;
    readonly mode?: string;
    readonly status?: string;
    readonly forwardSyncFromAt?: Date;
    readonly forwardSyncedAt?: Date | null;
    readonly backwardSyncFromAt?: Date | null;
    readonly backwardSyncedAt?: Date | null;
}

interface MccCategorySeedInput {
    readonly mcc: string;
    readonly mccGroupId?: number;
    readonly fullDescription?: string;
    readonly shortDescription?: string;
}

interface InstrumentSeedInput {
    readonly id?: number;
    readonly code?: string;
    readonly name?: string;
    readonly symbol?: string;
    readonly precision?: number;
    readonly type?: string;
}

export const seed = {
    instrument: (input: InstrumentSeedInput = {}): InstrumentEntityInterface =>
        insertOne<InstrumentEntityInterface>(InstrumentEntityTable, {
            id: input.id ?? 1,
            code: input.code ?? 'UAH',
            name: input.name ?? 'Hryvnia',
            symbol: input.symbol ?? '₴',
            precision: input.precision ?? 2,
            type: input.type ?? 'FIAT'
        }),
    account: (input: AccountSeedInput = {}): AccountEntityInterface =>
        insertOne<AccountEntityInterface>(AccountEntityTable, {
            title: input.title ?? 'Test Account',
            type: input.type ?? 'BANK_SYNC',
            nature: input.nature ?? 'ASSET',
            icon: input.icon ?? 'Wallet',
            instrumentId: input.instrumentId ?? 1,
            externalId: input.externalId ?? null,
            externalSource: input.externalSource ?? null,
            iban: input.iban ?? null
        }),
    bankSync: (input: BankSyncSeedInput): BankSyncEntityInterface =>
        insertOne<BankSyncEntityInterface>(BankSyncEntityTable, {
            accountId: input.accountId,
            token: input.token ?? 'test-token',
            provider: input.provider ?? 'MONOBANK',
            mode: input.mode ?? 'FORWARD',
            status: input.status ?? 'IDLE',
            enabled: true,
            forwardSyncFromAt: input.forwardSyncFromAt ?? new Date(),
            forwardSyncedAt: input.forwardSyncedAt ?? null,
            backwardSyncFromAt: input.backwardSyncFromAt ?? null,
            backwardSyncedAt: input.backwardSyncedAt ?? null,
            transactionCount: 0,
            errorCount: 0,
            lastError: null
        }),
    mccCategory: (input: MccCategorySeedInput): MccCategoryEntityInterface =>
        insertOne<MccCategoryEntityInterface>(MccCategoryEntityTable, {
            mcc: input.mcc,
            mccGroupId: input.mccGroupId ?? 1,
            fullDescription: input.fullDescription ?? `MCC ${input.mcc}`,
            shortDescription: input.shortDescription ?? `MCC ${input.mcc}`
        })
};
