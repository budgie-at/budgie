import { AccountDebtTypeEnum, AccountNatureEnum, InstrumentTypeEnum, PERSONAL_SYNC_ZONE, UserIconNameEnum } from '@budgie/contracts';

import type { AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';

const TIMESTAMP = new Date('2026-10-01T00:00:00Z');

export const buildAccountWithInstrument = (id: number, type: AccountTypeEnum, title: string): AccountWithInstrumentEntityInterface => ({
    id,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: null,
    syncId: `account-${id}`,
    syncZone: PERSONAL_SYNC_ZONE,
    icon: UserIconNameEnum.Home,
    parentId: null,
    order: 0,
    title,
    titleSearch: title.toLowerCase(),
    type,
    nature: AccountNatureEnum.ASSET,
    debtType: AccountDebtTypeEnum.LENT,
    instrumentId: 1,
    externalId: null,
    contactId: null,
    deadline: null,
    targetBalance: 0,
    targetBaseInstrumentId: null,
    targetBaseExchangeRate: null,
    targetBaseAmount: null,
    interestRate: null,
    installmentCount: null,
    externalSource: null,
    integrationId: null,
    iban: null,
    includeInNetWorth: true,
    isActive: true,
    isExternal: false,
    instrument: {
        id: 1,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
        deletedAt: null,
        type: InstrumentTypeEnum.FIAT,
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        priceProvider: null,
        providerInstrumentId: null,
        quoteInstrumentId: null,
        marketCapRank: null
    }
});
