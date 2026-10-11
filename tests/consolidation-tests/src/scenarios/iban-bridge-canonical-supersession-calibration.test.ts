import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { fetchLedgerBalances } from '../harness/consolidation-revert-audit';
import {
    seedIbanBridgeBalanceAdjustment,
    seedManualSupersessionCandidate,
    stampIbanBridgeTransactions,
    touchIbanBridgeAdjustments
} from '../harness/iban-bridge-supersession-fixture';
import { IBAN_BRIDGE_EUR_AMOUNT, IBAN_BRIDGE_UAH_AMOUNT } from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, TestLayer } from '../harness/test-context';

const HISTORICAL_CREATED_AT = Math.floor(new Date('2026-05-20T18:39:00Z').getTime() / 1000);
const CALIBRATION_CREATED_AT = HISTORICAL_CREATED_AT + 300;
const POST_CALIBRATION_CREATED_AT = CALIBRATION_CREATED_AT + 300;
const LATER_RECALIBRATION_AT = POST_CALIBRATION_CREATED_AT + 300;

const SUPERSESSION_CALIBRATION_CASES = [
    {
        title: 'keeps a calibrated historical prefix canonical active',
        supersededCreatedAt: HISTORICAL_CREATED_AT,
        recalibratedAt: null,
        expectedConsolidated: 0
    },
    {
        title: 'allows a post-calibration prefix canonical to supersede an older keeper canonical',
        supersededCreatedAt: POST_CALIBRATION_CREATED_AT,
        recalibratedAt: null,
        expectedConsolidated: 1
    },
    {
        title: 'keeps a superseded canonical active when its adjustment was recalibrated after it was created',
        supersededCreatedAt: POST_CALIBRATION_CREATED_AT,
        recalibratedAt: LATER_RECALIBRATION_AT,
        expectedConsolidated: 0
    }
];

layer(TestLayer)('consolidation/iban-bridge-canonical-supersession calibration', it => {
    it.effect.each(SUPERSESSION_CALIBRATION_CASES)('$title', ({ supersededCreatedAt, recalibratedAt, expectedConsolidated }) =>
        Effect.gen(function* () {
            const { bridgeAccount, bridgeIncome, canonical, sourceAccount, supersededCanonical, targetAccount } =
                yield* seedManualSupersessionCandidate();
            const accountIds = [sourceAccount.id, bridgeAccount.id, targetAccount.id];

            yield* stampIbanBridgeTransactions([canonical.id, bridgeIncome.id], HISTORICAL_CREATED_AT);
            yield* stampIbanBridgeTransactions([supersededCanonical.id], supersededCreatedAt);
            yield* seedIbanBridgeBalanceAdjustment(sourceAccount.id, CALIBRATION_CREATED_AT);
            yield* seedIbanBridgeBalanceAdjustment(bridgeAccount.id, CALIBRATION_CREATED_AT);
            yield* seedIbanBridgeBalanceAdjustment(targetAccount.id, CALIBRATION_CREATED_AT);
            if (isDefined(recalibratedAt)) {
                yield* touchIbanBridgeAdjustments(recalibratedAt);
            }

            const balancesBeforeConsolidation = yield* fetchLedgerBalances(accountIds);
            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(expectedConsolidated);
            expect((yield* testQueryService.fetchTransactionById(supersededCanonical.id)).consolidationParentTransactionId).toBe(
                isPositiveNumber(expectedConsolidated) ? canonical.id : null
            );
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(
                isPositiveNumber(expectedConsolidated)
                    ? [
                          [sourceAccount.id, -IBAN_BRIDGE_EUR_AMOUNT],
                          [bridgeAccount.id, 0],
                          [targetAccount.id, IBAN_BRIDGE_UAH_AMOUNT]
                      ]
                    : balancesBeforeConsolidation
            );
        })
    );
});
