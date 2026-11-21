import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer } from '../../harness';
import { importedCountsAfterEachStatus, stubDeposit, stubWithdrawal, HOUR_MS } from '../../harness/binance/capital-status-fixture';

describe('binance/capital-status-import', () => {
    it.effect.each([
        { label: 'pending deposit', stubHistory: stubDeposit, statuses: [0], counts: [0] },
        { label: 'rejected deposit', stubHistory: stubDeposit, statuses: [2], counts: [0] },
        { label: 'wrong deposit', stubHistory: stubDeposit, statuses: [7], counts: [0] },
        { label: 'deposit waiting for user confirmation', stubHistory: stubDeposit, statuses: [8], counts: [0] },
        { label: 'successful deposit', stubHistory: stubDeposit, statuses: [1], counts: [1] },
        { label: 'credited deposit that cannot withdraw', stubHistory: stubDeposit, statuses: [6], counts: [1] },
        { label: 'withdrawal with email sent', stubHistory: stubWithdrawal, statuses: [0], counts: [0] },
        { label: 'withdrawal awaiting approval', stubHistory: stubWithdrawal, statuses: [2], counts: [0] },
        { label: 'cancelled withdrawal', stubHistory: stubWithdrawal, statuses: [1], counts: [0] },
        { label: 'rejected withdrawal', stubHistory: stubWithdrawal, statuses: [3], counts: [0] },
        { label: 'processing withdrawal', stubHistory: stubWithdrawal, statuses: [4], counts: [0] },
        { label: 'failed withdrawal', stubHistory: stubWithdrawal, statuses: [5], counts: [0] },
        { label: 'completed withdrawal', stubHistory: stubWithdrawal, statuses: [6], counts: [1] },
        { label: 'deposit without a status', stubHistory: stubDeposit, statuses: [undefined], counts: [0] },
        { label: 'withdrawal without a status', stubHistory: stubWithdrawal, statuses: [undefined], counts: [0] }
    ])('imports a $label only when it is final-success', ({ stubHistory, statuses, counts }) =>
        Effect.gen(function* () {
            expect(yield* importedCountsAfterEachStatus(stubHistory, HOUR_MS / 2, statuses)).toEqual(counts);
        }).pipe(Effect.provide(TestLayer))
    );
});
