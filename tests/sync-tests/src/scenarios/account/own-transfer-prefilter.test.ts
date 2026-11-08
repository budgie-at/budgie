import { ExternalSourceEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { OwnTransferRepository } from '../../../../../packages/sync/src/core/repository/own-transfer.repository';
import { explainQueryPlan, seed, TestLayer } from '../../harness';

const identities = ['Коваленко Олена', 'Jane Smith'];
const titles = [
    'OWN---CARD',
    'deposit opening',
    'PROPRE COMPTE',
    'ouverture de dépôt',
    'cloture de depot',
    'На свою картку',
    'Na svoyu kartku',
    'СВІЙ РАХУНОК',
    'eigenen Konto',
    'Festgeld Auflösung',
    'cuenta propia',
    'apertura de deposito',
    'cierre de deposito',
    '*2468',
    'XX2468',
    '●2468',
    'Kovalenko Olena',
    'P24 *Kovalenko O.',
    'Jane S.',
    'Smith Jane',
    'Jáne Smith',
    'Binance UAH deposit',
    'Binance BTC withdrawal'
];

describe('account/own-transfer-prefilter', () => {
    it.effect('hydrates only title candidates from a merchant-heavy history', () =>
        Effect.gen(function* () {
            const repository = yield* OwnTransferRepository;
            const account = yield* seed.account();
            for (let index = 0; index < 200; index += 1) {
                const transaction = yield* seed.bankPairExpense(
                    { externalId: `merchant-${index}`, operatedAt: new Date('2001-01-01T00:00:00Z') },
                    { accountId: account.id, amount: 10_000_000 }
                );
                yield* seed.updateTransaction(transaction.id, {
                    title: index === 0 ? 'own account' : `Supermarket ${index}`,
                    externalSource: ExternalSourceEnum.MONOBANK
                });
            }
            const unfiltered = yield* repository.findTransactions(null);
            const filtered = yield* repository.findCandidates(null, identities);
            expect(unfiltered).toHaveLength(200);
            expect(filtered).toHaveLength(1);
            expect((yield* explainQueryPlan(repository.findCandidates(null, identities))).some(step => step.includes('SEARCH'))).toBe(true);
            expect(filtered[0].id).toBe(unfiltered.find(transaction => transaction.title === 'own account')?.id);
        }).pipe(Effect.provide([OwnTransferRepository.layer, TestLayer]))
    );

    it.effect('keeps historical signals and bypasses the prefilter for counterpart lookups', () =>
        Effect.gen(function* () {
            const repository = yield* OwnTransferRepository;
            const account = yield* seed.account();
            const transaction = yield* seed.bankPairExpense(
                { operatedAt: new Date('2001-01-01T00:00:00Z'), externalId: 'historical-transfer' },
                { accountId: account.id, amount: 10_000_000 }
            );
            for (const title of titles) {
                yield* seed.updateTransaction(transaction.id, { title, externalSource: ExternalSourceEnum.MONOBANK });
                expect((yield* repository.findCandidates(null, identities)).map(candidate => candidate.id)).toContain(transaction.id);
            }
            yield* seed.updateTransaction(transaction.id, { title: 'Groceries' });
            expect(yield* repository.findCandidates(null, identities)).toEqual([]);
            expect((yield* repository.findTransactions(null, [transaction.id])).map(candidate => candidate.id)).toEqual([transaction.id]);
        }).pipe(Effect.provide([OwnTransferRepository.layer, TestLayer]))
    );
});
