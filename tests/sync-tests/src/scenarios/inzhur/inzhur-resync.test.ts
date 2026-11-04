import { PRECISION } from '@budgie/contracts';
import { ResyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurBaselineItems } from '../../harness/inzhur/build-inzhur-baseline-items';
import { FIRST_URI } from '../../harness/inzhur/inzhur-statement-fixtures.constant';
import { makeInzhurLayer } from '../../harness/inzhur/make-inzhur-layer';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { setUpInzhurWithBaseline } from '../../harness/inzhur/set-up-inzhur-with-baseline';

const BASELINE_DATE = '2026-09-30';

const layer = makeInzhurLayer({ [FIRST_URI]: buildInzhurBaselineItems(1000, 2) });

describe('inzhur/resync', () => {
    it.effect.each([{ sinceDays: null }, { sinceDays: 30 }])(
        'keeps the last statement date when resync is requested with $sinceDays',
        ({ sinceDays }) =>
            Effect.gen(function* () {
                const resyncService = yield* ResyncService;
                const { cashAccount, reitAccount } = yield* setUpInzhurWithBaseline(1000, 1000, 2);

                yield* resyncService.resync({ accountId: cashAccount.id, sinceDays });
                yield* resyncService.resync({ accountId: reitAccount.id, sinceDays });

                expect((yield* requireInzhurSetup()).lastStatementDate).toBe(BASELINE_DATE);
                expect(yield* fetchAccountBalance(cashAccount.id)).toBe(1000 * PRECISION);
            }).pipe(Effect.provide(layer))
    );
});
