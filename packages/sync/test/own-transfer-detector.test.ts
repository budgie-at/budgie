import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { ownTransferDetector } from '../src/core/detector/own-transfer.detector';

const account = { externalId: '400000****2468', iban: null, title: 'Card' };

describe('own transfer signals', () => {
    for (const title of ['*2468', '****2468', '400000****2468', '•2468']) {
        it.effect(`matches ${title}`, () =>
            Effect.sync(() => {
                expect(ownTransferDetector.matchesAccount(title, account)).toBe(true);
            })
        );
    }
    it.effect('rejects other cards and other names', () =>
        Effect.sync(() => {
            expect(ownTransferDetector.matchesAccount('*9999', account)).toBe(false);
            expect(ownTransferDetector.matches('Ірина М.', ['Коваленко Олена'])).toBe(false);
        })
    );
    it.effect('matches reordered, abbreviated and transliterated holder names', () =>
        Effect.sync(() => {
            for (const title of ['Олена К.', 'Olena K.', 'P24 *Kovalenko Olena', 'Олена Коваленко']) {
                expect(ownTransferDetector.matches(title, ['Коваленко Олена'])).toBe(true);
            }
        })
    );
});
