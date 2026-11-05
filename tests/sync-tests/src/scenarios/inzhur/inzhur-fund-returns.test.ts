import { AccountTypeEnum, ExternalSourceEnum, InvestmentReturnRepository, PRECISION } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed } from '../../harness';
import { buildInzhurBaselineItems, buildInzhurHoldings } from '../../harness/inzhur/build-inzhur-baseline-items';
import { buildInzhurStatementItems } from '../../harness/inzhur/build-inzhur-statement-items';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { importInzhurStatement } from '../../harness/inzhur/import-inzhur-statement';
import { INZHUR_REIT_LAYOUT } from '../../harness/inzhur/inzhur-fund-layouts';
import { FIRST_URI, SECOND_DATE, SECOND_URI } from '../../harness/inzhur/inzhur-statement-fixtures.constant';
import { makeInzhurLayer } from '../../harness/inzhur/make-inzhur-layer';
import { setUpInzhurWithBaseline } from '../../harness/inzhur/set-up-inzhur-with-baseline';

const layer = makeInzhurLayer({
    [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(1100, 3))
});

describe('inzhur/fund-returns', () => {
    it.effect('groups bank and reinvested dividends by the linked fund account', () =>
        Effect.gen(function* () {
            const investmentReturnRepository = yield* InvestmentReturnRepository;
            const { reitAccount, energyAccount } = yield* setUpInzhurWithBaseline(100, 1000, 2);
            const bankAccount = yield* seed.account({
                title: 'Monobank Card',
                externalId: 'inzhur-fund-returns-card',
                externalSource: ExternalSourceEnum.MONOBANK,
                type: AccountTypeEnum.BANK_SYNC,
                instrumentId: 1
            });

            yield* importInzhurStatement(SECOND_URI);
            yield* importInzhurBankTransaction(
                bankAccount.id,
                'dividend',
                `ІНЖУР КЕПІТАЛ дивіденд ${INZHUR_REIT_LAYOUT.isin}`,
                120,
                new Date('2026-11-05T12:00:00.000Z')
            );
            yield* Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));

            const totals = (yield* investmentReturnRepository.getFundDividendTotals()).toSorted(
                (left, right) => left.fundAccountId - right.fundAccountId
            );

            expect(totals).toEqual([
                { fundAccountId: reitAccount.id, bank: 120 * PRECISION, reinvested: 980 * PRECISION },
                { fundAccountId: energyAccount.id, bank: 0, reinvested: 3920 * PRECISION }
            ]);
            expect(yield* investmentReturnRepository.findFirstEntryOperatedAt(reitAccount.id)).toEqual(
                new Date('2026-09-30T12:00:00.000Z')
            );
        }).pipe(Effect.provide(layer))
    );
});
