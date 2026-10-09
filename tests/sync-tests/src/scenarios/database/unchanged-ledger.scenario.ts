import { AccountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { AccountBalanceRepository, AccountDebtTypeEnum, AccountTypeEnum, PRECISION, UserIconNameEnum } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { TransferConsolidationService } from '@budgie/sync';
import { expect } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { applyMigration, seed, seedBankPair, testDb, TestLayer } from '../../harness';

import { OPERATED_AT } from './data-migration-money-impact.constant';

const ATM_AMOUNT = Number('408') * PRECISION;
const GROCERY_AMOUNT = 37 * PRECISION;
const SALARY_AMOUNT = Number('2100') * PRECISION;
const TRANSFER_AMOUNT = 150 * PRECISION;
const DEBT_TARGET_BALANCE = 90;
const ONE_DAY_SECONDS = 86_400;

const seedLedgerFixture = Effect.fnUntraced(function* () {
    const accountDebtOpeningService = yield* AccountDebtOpeningService;
    const bankAccount = yield* seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
    const historicalAtm = yield* seedBankPair.expense(
        { externalId: 'tx-atm', operatedAt: OPERATED_AT },
        { accountId: bankAccount.id, amount: ATM_AMOUNT }
    );

    yield* seedBankPair.expense(
        { externalId: 'tx-groceries', operatedAt: OPERATED_AT },
        { accountId: bankAccount.id, amount: GROCERY_AMOUNT }
    );
    yield* seedBankPair.income({ externalId: 'tx-salary', operatedAt: OPERATED_AT }, { accountId: bankAccount.id, amount: SALARY_AMOUNT });
    yield* seed.directTransfer({
        exchangeRate: 1,
        operatedAt: OPERATED_AT,
        sourceAccountId: bankAccount.id,
        sourceAmount: TRANSFER_AMOUNT,
        sourceEntryExchangeRate: 1,
        targetAccountId: cashAccount.id,
        targetAmount: TRANSFER_AMOUNT,
        toIban: null
    });
    yield* testDb.$client.unsafe(`UPDATE transactions SET title = 'Банкомат Erste Bank' WHERE id = ${historicalAtm.id}`);
    yield* testDb.$client.unsafe(
        `UPDATE transaction_entries SET created_at = (SELECT MIN(created_at) FROM mcc_categories) - ${ONE_DAY_SECONDS} WHERE transaction_id = ${historicalAtm.id}`
    );
    const debtAccount = yield* accountDebtOpeningService.openDebtWithFundingAccount(
        {
            title: 'Alex owes me',
            iban: null,
            icon: UserIconNameEnum.HandCoins,
            instrumentId: 1,
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.LENT,
            currentBalance: 0,
            targetBalance: DEBT_TARGET_BALANCE,
            contactId: null,
            deadline: null
        },
        bankAccount.id
    );

    return [bankAccount.id, cashAccount.id, debtAccount.id];
});

export const unchangedLedgerScenario = (migrationName: string) =>
    Effect.gen(function* () {
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const transferConsolidationService = yield* TransferConsolidationService;
        const accountIds = yield* seedLedgerFixture();
        yield* transferConsolidationService.consolidate(null);
        const ledgerBefore = yield* accountBalanceRepository.getLedgerBalances(accountIds);

        yield* applyMigration(migrationName);
        yield* transferConsolidationService.consolidate(null);
        yield* accountBalanceIncrementalService.updateAllBalances(false);

        expect(yield* accountBalanceRepository.getLedgerBalances(accountIds)).toEqual(ledgerBefore);
    }).pipe(Effect.provide(TestLayer));
