import { AccountRepository, PRECISION, InvestmentReturnRepository, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { REIT_DIVIDEND_DESCRIPTION } from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { ENERGY_ISIN, REIT_ISIN } from '../../harness/inzhur/inzhur-fund-isins.constant';
import { BASE_ROWS, DIVIDEND_TYPE, REIT } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundAccount } from '../../harness/inzhur/require-inzhur-fund-account';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';

const URI = 'returns.xlsx';

const layer = makeInzhurOperationsLayer({
    [URI]: buildInzhurOperationsWorkbook([
        ...BASE_ROWS,
        { at: '2026-01-10T10:06:00', type: 'Купівля 2 сертифікати', fund: 'Inzhur Energy', credit: 20 },
        { at: '2026-02-01T10:00:00', type: DIVIDEND_TYPE, fund: REIT, debit: 100 },
        { at: '2026-02-01T10:01:00', type: DIVIDEND_TYPE, fund: 'Inzhur Energy', debit: 40 }
    ])
});

describe('inzhur/fund-returns', () => {
    it.effect('groups bank and export dividends by the linked fund account', () =>
        Effect.gen(function* () {
            const investmentReturnRepository = yield* InvestmentReturnRepository;
            const bankAccount = yield* seedInzhurBankAccount;

            yield* importInzhurOperations(URI);
            const reit = yield* requireInzhurFundAccount(REIT_ISIN);
            yield* (yield* AccountRepository).updateById(reit.id, { title: 'Retirement' });
            yield* importInzhurBankFlow(bankAccount.id, 'dividend', REIT_DIVIDEND_DESCRIPTION, 120, new Date('2026-05-05T12:00:00.000Z'));

            const energy = yield* requireInzhurFundAccount(ENERGY_ISIN);
            const movements = yield* investmentReturnRepository.findLedgerMovements([
                reit.id,
                energy.id,
                bankAccount.id,
                (yield* requireInzhurSetup()).cashAccount.id
            ]);

            const dividends = movements.filter(movement => movement.transactionType === TransactionTypeEnum.INCOME);
            expect(
                dividends.filter(movement => movement.fundAccountId === reit.id).reduce((sum, movement) => sum + movement.amount, 0)
            ).toBe(220 * PRECISION);
            expect(
                dividends.filter(movement => movement.fundAccountId === energy.id).reduce((sum, movement) => sum + movement.amount, 0)
            ).toBe(40 * PRECISION);
            expect(
                movements.filter(
                    movement =>
                        movement.transactionType === TransactionTypeEnum.TRANSFER && [reit.id, energy.id].includes(movement.accountId)
                )
            ).toHaveLength(2);
        }).pipe(Effect.provide(layer))
    );
});
