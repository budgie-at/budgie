import {
    BORROWING_CATEGORY_ID,
    CategoryRepository,
    CategoryEntityTable,
    DefaultCategoryTranslationEntityTable,
    LanguageEnum,
    LENDING_CATEGORY_ID,
    UserIconNameEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { TestLayer } from '../../harness';
import { testDb } from '../../harness/scenario/setup';

const DEBT_CATEGORY_IDS = [LENDING_CATEGORY_ID, BORROWING_CATEGORY_ID];

const fetchDebtSystemCategories = () =>
    Effect.gen(function* () {
        return yield* testDb.select().from(CategoryEntityTable).where(inArray(CategoryEntityTable.id, DEBT_CATEGORY_IDS));
    });

const fetchDebtSystemTranslations = () =>
    Effect.gen(function* () {
        return yield* testDb
            .select()
            .from(DefaultCategoryTranslationEntityTable)
            .where(inArray(DefaultCategoryTranslationEntityTable.categoryId, DEBT_CATEGORY_IDS));
    });

describe('category/debt-system-categories', () => {
    it.effect('seeds Lending and Borrowing as default system categories with a title per language', () =>
        Effect.gen(function* () {
            const categories = yield* fetchDebtSystemCategories();
            const lending = categories.find(category => category.id === LENDING_CATEGORY_ID);
            const borrowing = categories.find(category => category.id === BORROWING_CATEGORY_ID);

            expect(lending).toMatchObject({ title: 'Lending', icon: UserIconNameEnum.HandCoins, isDefault: true, isSystemCategory: true });
            expect(borrowing).toMatchObject({
                title: 'Borrowing',
                icon: UserIconNameEnum.Handshake,
                isDefault: true,
                isSystemCategory: true
            });
            expect(yield* fetchDebtSystemTranslations()).toHaveLength(10);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('offers both categories in the picker while keeping every other system category hidden', () =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const pickable = yield* categoryRepository.findBySearchQuery('', true, LanguageEnum.EN);

            expect(
                pickable
                    .filter(category => category.isSystemCategory)
                    .map(category => category.id)
                    .sort()
            ).toEqual(DEBT_CATEGORY_IDS);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('finds the localized title through the picker search', () =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const results = yield* categoryRepository.findBySearchQuery('Надані', true, LanguageEnum.UK);

            expect(results.find(category => category.id === LENDING_CATEGORY_ID)?.title).toBe('Надані позики');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('never offers system categories as AI suggestion candidates', () =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const candidates = yield* categoryRepository.findAllNonSystemLocalized(LanguageEnum.EN);

            expect(candidates.every(category => !category.isSystemCategory)).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );
});
