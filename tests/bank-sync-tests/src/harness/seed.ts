import {
    AccountEntityTable,
    AccountNatureEnum,
    AccountTypeEnum,
    BankSyncEntityTable,
    BankSyncModeEnum,
    BankSyncStatusEnum,
    ExternalSourceEnum,
    InstrumentEntityTable,
    InstrumentTypeEnum,
    MccCategoryEntityTable,
    UserIconNameEnum
} from '@budgie/contracts';

import { insertOne } from './insert-one';

import type {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    BankSyncCreateEntityInterface,
    BankSyncEntityInterface,
    InstrumentCreateEntityInterface,
    InstrumentEntityInterface,
    MccCategoryCreateEntityInterface,
    MccCategoryEntityInterface
} from '@budgie/contracts';

export const seed = {
    instrument: (input: Partial<InstrumentCreateEntityInterface> = {}): InstrumentEntityInterface =>
        insertOne(InstrumentEntityTable, {
            code: input.code ?? 'UAH',
            name: input.name ?? 'Hryvnia',
            symbol: input.symbol ?? '₴',
            type: input.type ?? InstrumentTypeEnum.FIAT
        } satisfies InstrumentCreateEntityInterface),
    account: (input: Partial<AccountCreateEntityInterface> = {}): AccountEntityInterface =>
        insertOne(AccountEntityTable, {
            title: input.title ?? 'Test Account',
            type: input.type ?? AccountTypeEnum.BANK_SYNC,
            nature: input.nature ?? AccountNatureEnum.ASSET,
            icon: input.icon ?? UserIconNameEnum.Wallet,
            order: input.order ?? 0,
            instrumentId: input.instrumentId ?? 1,
            externalId: input.externalId ?? null,
            externalSource: input.externalSource ?? null,
            iban: input.iban ?? null
        } satisfies AccountCreateEntityInterface),
    bankSync: (input: Partial<BankSyncCreateEntityInterface> & Pick<BankSyncCreateEntityInterface, 'accountId'>): BankSyncEntityInterface =>
        insertOne(BankSyncEntityTable, {
            accountId: input.accountId,
            token: input.token ?? 'test-token',
            provider: input.provider ?? ExternalSourceEnum.MONOBANK,
            mode: input.mode ?? BankSyncModeEnum.FORWARD,
            status: input.status ?? BankSyncStatusEnum.IDLE,
            enabled: input.enabled ?? true,
            forwardSyncFromAt: input.forwardSyncFromAt ?? new Date(),
            forwardSyncedAt: input.forwardSyncedAt ?? null,
            backwardSyncFromAt: input.backwardSyncFromAt ?? null,
            backwardSyncedAt: input.backwardSyncedAt ?? null,
            transactionCount: input.transactionCount ?? 0,
            errorCount: input.errorCount ?? 0,
            lastError: input.lastError ?? null
        } satisfies BankSyncCreateEntityInterface),
    mccCategory: (input: Partial<MccCategoryCreateEntityInterface> & Pick<MccCategoryCreateEntityInterface, 'mcc'>): MccCategoryEntityInterface =>
        insertOne(MccCategoryEntityTable, {
            mcc: input.mcc,
            mccGroupId: input.mccGroupId ?? 1,
            fullDescription: input.fullDescription ?? `MCC ${input.mcc}`,
            shortDescription: input.shortDescription ?? `MCC ${input.mcc}`
        } satisfies MccCategoryCreateEntityInterface)
};
