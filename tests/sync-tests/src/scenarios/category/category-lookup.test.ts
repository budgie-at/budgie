import { CategoryRepository, LanguageEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer } from '../../harness';

describe('category/category-lookup', () => {
    it.effect('orders equally used search results by id', () =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const first = yield* seed.category('Zzlookup first');
            const second = yield* seed.category('Zzlookup second');
            yield* testDb.$client.unsafe("UPDATE categories SET sync_id = 'zz' WHERE id = ?", [first.id]);
            yield* testDb.$client.unsafe("UPDATE categories SET sync_id = 'aa' WHERE id = ?", [second.id]);

            const results = yield* categoryRepository.findBySearchQuery('zzlookup', true, LanguageEnum.EN);

            expect(results.map(category => category.id)).toStrictEqual([first.id, second.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns the localized rows of only the requested ids', () =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const [localized] = yield* categoryRepository.findAllNonSystemLocalized(LanguageEnum.DE);
            const custom = yield* seed.category('Custom');
            yield* seed.category('Other');

            const results = yield* categoryRepository.findByIdsLocalized([localized.id, custom.id], LanguageEnum.DE);
            const singles = yield* Effect.forEach([localized.id, custom.id], id => categoryRepository.findById(id, LanguageEnum.DE));

            expect([...results].sort((left, right) => left.id - right.id)).toStrictEqual(singles.flat());
            expect(results.map(category => category.title)).toContain(localized.title);
            expect(yield* categoryRepository.findByIdsLocalized([], LanguageEnum.DE)).toStrictEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});
