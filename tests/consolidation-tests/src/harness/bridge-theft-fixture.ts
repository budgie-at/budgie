import { ExternalSourceEnum, PRECISION } from '@budgie/contracts';
import { ExchangeRateEntityTable, InstrumentTypeEnum } from '@budgie/contracts';
import { expect } from 'vitest';

import { IBAN_BRIDGE_TRANSFER_MCC } from './iban-bridge-topology';
import { testDb, testQueryService, testSeedService } from './test-context';

import type { TransactionEntityInterface } from '@budgie/contracts';

export interface BridgeTheftPairFixtureInterface {
    readonly fxExpenseId: number;
    readonly fxBridgeIncomeId: number;
    readonly interbankExpenseId: number;
}

export const BRIDGE_THEFT_FX_EUR_AMOUNT = 620.34 * PRECISION;
export const BRIDGE_THEFT_FX_UAH_AMOUNT = 29_900 * PRECISION;
export const BRIDGE_THEFT_FX_OPERATED_AT = new Date('2025-10-15T13:49:56');
const BRIDGE_THEFT_FX_EXPENSE_TITLE = 'На гривневий рахунок ФОП для переказу на картку';
const BRIDGE_THEFT_FX_INCOME_TITLE = 'З єврового рахунку ФОП для переказу на картку';
export const BRIDGE_THEFT_INTERBANK_EXPENSE_TITLE = 'приват сина 3';

const seedBridgeTheftInstruments = (): { readonly eurInstrumentId: number; readonly uahInstrumentId: number } => {
    const uah = testSeedService.instrument({ code: 'UAH', name: 'Hryvnia', symbol: '₴', type: InstrumentTypeEnum.FIAT });
    const eur = testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€', type: InstrumentTypeEnum.FIAT });
    testDb
        .insert(ExchangeRateEntityTable)
        .values({ baseInstrumentId: eur.id, quoteInstrumentId: uah.id, rate: 48.2, source: 'test' })
        .run();

    return { eurInstrumentId: eur.id, uahInstrumentId: uah.id };
};

const seedBridgeTheftAccounts = (
    eurInstrumentId: number,
    uahInstrumentId: number
): {
    readonly bridgeUahAccountId: number;
    readonly blackUahAccountId: number;
    readonly sourceEurAccountId: number;
} => {
    const sourceEurAccount = testSeedService.bankSyncAccount('Fop EUR', ExternalSourceEnum.MONOBANK, null, eurInstrumentId);
    const bridgeUahAccount = testSeedService.bankSyncAccount('Fop UAH', ExternalSourceEnum.MONOBANK, null, uahInstrumentId);
    const blackUahAccount = testSeedService.bankSyncAccount('Black UAH', ExternalSourceEnum.MONOBANK, null, uahInstrumentId);

    return {
        bridgeUahAccountId: bridgeUahAccount.id,
        blackUahAccountId: blackUahAccount.id,
        sourceEurAccountId: sourceEurAccount.id
    };
};

const seedBridgeTheftFxLegs = (
    sourceEurAccountId: number,
    bridgeUahAccountId: number
): {
    readonly fxExpense: TransactionEntityInterface;
    readonly fxBridgeIncome: TransactionEntityInterface;
} => {
    const fxExpense = testSeedService.bankPairExpense(
        { externalId: 'fx-expense', operatedAt: BRIDGE_THEFT_FX_OPERATED_AT },
        { accountId: sourceEurAccountId, amount: BRIDGE_THEFT_FX_EUR_AMOUNT }
    );
    testSeedService.updateTransaction(fxExpense.id, { title: BRIDGE_THEFT_FX_EXPENSE_TITLE });
    const fxBridgeIncome = testSeedService.bankPairIncome(
        { externalId: 'fx-income', operatedAt: new Date(BRIDGE_THEFT_FX_OPERATED_AT.getTime() + 1_000) },
        { accountId: bridgeUahAccountId, amount: BRIDGE_THEFT_FX_UAH_AMOUNT }
    );
    testSeedService.updateTransaction(fxBridgeIncome.id, { title: BRIDGE_THEFT_FX_INCOME_TITLE });
    testSeedService.updateTransaction(fxExpense.id, { externalSource: ExternalSourceEnum.MONOBANK });
    testSeedService.updateTransaction(fxBridgeIncome.id, { externalSource: ExternalSourceEnum.MONOBANK });

    return { fxExpense, fxBridgeIncome };
};

const seedBridgeTheftInterbankExpense = (blackUahAccountId: number): TransactionEntityInterface => {
    const transferMccId = testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC).id;
    const interbankExpense = testSeedService.bankPairExpense(
        { externalId: 'interbank-expense', operatedAt: new Date(BRIDGE_THEFT_FX_OPERATED_AT.getTime() + 131_000) },
        { accountId: blackUahAccountId, amount: BRIDGE_THEFT_FX_UAH_AMOUNT, mccCategoryId: transferMccId }
    );
    testSeedService.updateTransaction(interbankExpense.id, { title: BRIDGE_THEFT_INTERBANK_EXPENSE_TITLE });
    testSeedService.updateTransaction(interbankExpense.id, { externalSource: ExternalSourceEnum.MONOBANK });

    return interbankExpense;
};

export const expectFxPairCanonicalChildren = (canonicalId: number, fixture: BridgeTheftPairFixtureInterface): void => {
    const childIds = testQueryService.fetchChildTransactionIds(canonicalId);
    expect(childIds).toContain(fixture.fxExpenseId);
    expect(childIds).toContain(fixture.fxBridgeIncomeId);
    expect(childIds).not.toContain(fixture.interbankExpenseId);
};

export const seedBridgeTheftFixture = (): {
    readonly bridgeUahAccountId: number;
    readonly fxExpense: TransactionEntityInterface;
    readonly fxBridgeIncome: TransactionEntityInterface;
    readonly interbankExpense: TransactionEntityInterface;
    readonly interbankExpenseAccountId: number;
    readonly sourceEurAccountId: number;
} => {
    const { eurInstrumentId, uahInstrumentId } = seedBridgeTheftInstruments();
    const accounts = seedBridgeTheftAccounts(eurInstrumentId, uahInstrumentId);
    const { fxExpense, fxBridgeIncome } = seedBridgeTheftFxLegs(accounts.sourceEurAccountId, accounts.bridgeUahAccountId);
    const interbankExpense = seedBridgeTheftInterbankExpense(accounts.blackUahAccountId);

    return {
        bridgeUahAccountId: accounts.bridgeUahAccountId,
        fxExpense,
        fxBridgeIncome,
        interbankExpense,
        interbankExpenseAccountId: accounts.blackUahAccountId,
        sourceEurAccountId: accounts.sourceEurAccountId
    };
};
