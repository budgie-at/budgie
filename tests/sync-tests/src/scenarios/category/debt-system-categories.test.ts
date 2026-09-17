import { categoryRepository } from '@app/@generic/drizzle/db/db';
import {
    BORROWING_CATEGORY_ID,
    CategoryEntityTable,
    DefaultCategoryTranslationEntityTable,
    LanguageEnum,
    LENDING_CATEGORY_ID,
    UserIconNameEnum
} from '@budgie/contracts';
import { inArray } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { applyMigration } from '../../harness/db/apply-migration';
import { testDb } from '../../harness/scenario/setup';

const DEBT_CATEGORY_IDS = [LENDING_CATEGORY_ID, BORROWING_CATEGORY_ID];

const fetchDebtSystemCategories = () => testDb.select().from(CategoryEntityTable).where(inArray(CategoryEntityTable.id, DEBT_CATEGORY_IDS));

const fetchDebtSystemTranslations = () =>
    testDb
        .select()
        .from(DefaultCategoryTranslationEntityTable)
        .where(inArray(DefaultCategoryTranslationEntityTable.categoryId, DEBT_CATEGORY_IDS));

describe('category/debt-system-categories', () => {
    it('seeds Lending and Borrowing as default system categories with a title per language', async () => {
        const categories = await fetchDebtSystemCategories();
        const lending = categories.find(category => category.id === LENDING_CATEGORY_ID);
        const borrowing = categories.find(category => category.id === BORROWING_CATEGORY_ID);

        expect(lending).toMatchObject({ title: 'Lending', icon: UserIconNameEnum.HandCoins, isDefault: true, isSystemCategory: true });
        expect(borrowing).toMatchObject({ title: 'Borrowing', icon: UserIconNameEnum.Handshake, isDefault: true, isSystemCategory: true });
        expect(await fetchDebtSystemTranslations()).toHaveLength(10);
    });

    it('stays a no-op when the migration runs twice', async () => {
        await applyMigration('0057_add_debt_system_categories.sql');

        expect(await fetchDebtSystemCategories()).toHaveLength(2);
        expect(await fetchDebtSystemTranslations()).toHaveLength(10);
    });

    it('offers both categories in the picker while keeping every other system category hidden', async () => {
        const pickable = await categoryRepository.findBySearchQuery('', true, LanguageEnum.EN);

        expect(
            pickable
                .filter(category => category.isSystemCategory)
                .map(category => category.id)
                .sort()
        ).toEqual(DEBT_CATEGORY_IDS);
    });

    it('finds the localized title through the picker search', async () => {
        const results = await categoryRepository.findBySearchQuery('Надані', true, LanguageEnum.UK);

        expect(results.find(category => category.id === LENDING_CATEGORY_ID)?.title).toBe('Надані позики');
    });

    it('never offers system categories as AI suggestion candidates', async () => {
        const candidates = await categoryRepository.findAllNonSystemLocalized(LanguageEnum.EN);

        expect(candidates.every(category => !category.isSystemCategory)).toBe(true);
    });
});
