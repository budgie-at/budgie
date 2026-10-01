import { ExternalSourceEnum, PRECISION } from '@budgie/contracts';
import { ExchangeRateEntityTable, InstrumentTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { IBAN_BRIDGE_TRANSFER_MCC } from './iban-bridge-topology';
import { testDb, testQueryService, testSeedService } from './test-context';


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

const seedBridgeTheftInstruments = () =>
    Effect.gen(function* () {
        const uah = yield* testSeedService.instrument({ code: 'UAH', name: 'Hryvnia', symbol: '₴', type: InstrumentTypeEnum.FIAT });
        const eur = yield* testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€', type: InstrumentTypeEnum.FIAT });
        yield* testDb
            .insert(ExchangeRateEntityTable)
            .values({ baseInstrumentId: eur.id, quoteInstrumentId: uah.id, rate: 48.2, source: 'test' });

        return { eurInstrumentId: eur.id, uahInstrumentId: uah.id };
    });

const seedBridgeTheftAccounts = (eurInstrumentId: number, uahInstrumentId: number) =>
    Effect.gen(function* () {
        const sourceEurAccount = yield* testSeedService.bankSyncAccount('Fop EUR', ExternalSourceEnum.MONOBANK, null, eurInstrumentId);
        const bridgeUahAccount = yield* testSeedService.bankSyncAccount('Fop UAH', ExternalSourceEnum.MONOBANK, null, uahInstrumentId);
        const blackUahAccount = yield* testSeedService.bankSyncAccount('Black UAH', ExternalSourceEnum.MONOBANK, null, uahInstrumentId);

        return {
            bridgeUahAccountId: bridgeUahAccount.id,
            blackUahAccountId: blackUahAccount.id,
            sourceEurAccountId: sourceEurAccount.id
        };
    });

const seedBridgeTheftFxLegs = (sourceEurAccountId: number, bridgeUahAccountId: number) =>
    Effect.gen(function* () {
        const fxExpense = yield* testSeedService.bankPairExpense(
            { externalId: 'fx-expense', operatedAt: BRIDGE_THEFT_FX_OPERATED_AT },
            { accountId: sourceEurAccountId, amount: BRIDGE_THEFT_FX_EUR_AMOUNT }
        );
        yield* testSeedService.updateTransaction(fxExpense.id, { title: BRIDGE_THEFT_FX_EXPENSE_TITLE });
        const fxBridgeIncome = yield* testSeedService.bankPairIncome(
            { externalId: 'fx-income', operatedAt: new Date(BRIDGE_THEFT_FX_OPERATED_AT.getTime() + 1_000) },
            { accountId: bridgeUahAccountId, amount: BRIDGE_THEFT_FX_UAH_AMOUNT }
        );
        yield* testSeedService.updateTransaction(fxBridgeIncome.id, { title: BRIDGE_THEFT_FX_INCOME_TITLE });
        yield* testSeedService.updateTransaction(fxExpense.id, { externalSource: ExternalSourceEnum.MONOBANK });
        yield* testSeedService.updateTransaction(fxBridgeIncome.id, { externalSource: ExternalSourceEnum.MONOBANK });

        return { fxExpense, fxBridgeIncome };
    });

const seedBridgeTheftInterbankExpense = (blackUahAccountId: number) =>
    Effect.gen(function* () {
        const transferMccId = (yield* testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC)).id;
        const interbankExpense = yield* testSeedService.bankPairExpense(
            { externalId: 'interbank-expense', operatedAt: new Date(BRIDGE_THEFT_FX_OPERATED_AT.getTime() + 131_000) },
            { accountId: blackUahAccountId, amount: BRIDGE_THEFT_FX_UAH_AMOUNT, mccCategoryId: transferMccId }
        );
        yield* testSeedService.updateTransaction(interbankExpense.id, { title: BRIDGE_THEFT_INTERBANK_EXPENSE_TITLE });
        yield* testSeedService.updateTransaction(interbankExpense.id, { externalSource: ExternalSourceEnum.MONOBANK });

        return interbankExpense;
    });

export const expectFxPairCanonicalChildren = (canonicalId: number, fixture: BridgeTheftPairFixtureInterface) =>
    Effect.gen(function* () {
        const childIds = yield* testQueryService.fetchChildTransactionIds(canonicalId);
        expect(childIds).toContain(fixture.fxExpenseId);
        expect(childIds).toContain(fixture.fxBridgeIncomeId);
        expect(childIds).not.toContain(fixture.interbankExpenseId);
    });

export const seedBridgeTheftFixture = () =>
    Effect.gen(function* () {
        const { eurInstrumentId, uahInstrumentId } = yield* seedBridgeTheftInstruments();
        const accounts = yield* seedBridgeTheftAccounts(eurInstrumentId, uahInstrumentId);
        const { fxExpense, fxBridgeIncome } = yield* seedBridgeTheftFxLegs(accounts.sourceEurAccountId, accounts.bridgeUahAccountId);
        const interbankExpense = yield* seedBridgeTheftInterbankExpense(accounts.blackUahAccountId);

        return {
            bridgeUahAccountId: accounts.bridgeUahAccountId,
            fxExpense,
            fxBridgeIncome,
            interbankExpense,
            interbankExpenseAccountId: accounts.blackUahAccountId,
            sourceEurAccountId: accounts.sourceEurAccountId
        };
    });
