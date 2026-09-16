import { categoryRepository } from '@app/@generic/drizzle/db/db';
import {
    BORROWING_CATEGORY_ID,
    CategoryEntityTable,
    DEBT_SYSTEM_CATEGORY_IDS,
    DefaultCategoryTranslationEntityTable,
    LanguageEnum,
    LENDING_CATEGORY_ID,
    UserIconNameEnum
} from '@budgie/contracts';
import { inArray } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { applyMigration } from '../../harness/db/apply-migration';
import { testDb } from '../../harness/scenario/setup';

const MIGRATION_FILE = '0057_add_debt_system_categories.sql';
const SYSTEM_CATEGORY_TITLES: Record<LanguageEnum, readonly [string, string]> = {
    [LanguageEnum.EN]: ['Lending', 'Borrowing'],
    [LanguageEnum.UK]: ['Надані позики', 'Отримані позики'],
    [LanguageEnum.DE]: ['Verliehenes Geld', 'Geliehenes Geld'],
    [LanguageEnum.ES]: ['Préstamos Concedidos', 'Préstamos Recibidos'],
    [LanguageEnum.FR]: ['Prêts Accordés', 'Emprunts']
};

const fetchDebtSystemCategories = () =>
    testDb.select().from(CategoryEntityTable).where(inArray(CategoryEntityTable.id, DEBT_SYSTEM_CATEGORY_IDS));

const fetchDebtSystemTranslations = () =>
    testDb
        .select()
        .from(DefaultCategoryTranslationEntityTable)
        .where(inArray(DefaultCategoryTranslationEntityTable.categoryId, DEBT_SYSTEM_CATEGORY_IDS));

describe('category/debt-system-categories', () => {
    it('seeds Lending and Borrowing as default system categories', async () => {
        const categories = await fetchDebtSystemCategories();
        const lending = categories.find(category => category.id === LENDING_CATEGORY_ID);
        const borrowing = categories.find(category => category.id === BORROWING_CATEGORY_ID);

        expect(categories).toHaveLength(2);
        expect(lending).toMatchObject({ title: 'Lending', icon: UserIconNameEnum.HandCoins, isDefault: true, isSystemCategory: true });
        expect(borrowing).toMatchObject({ title: 'Borrowing', icon: UserIconNameEnum.Handshake, isDefault: true, isSystemCategory: true });
        expect(lending?.deletedAt).toBeNull();
        expect(borrowing?.deletedAt).toBeNull();
    });

    it('seeds titles for every supported language', async () => {
        const translations = await fetchDebtSystemTranslations();

        expect(translations).toHaveLength(10);
        Object.entries(SYSTEM_CATEGORY_TITLES).forEach(([language, [lendingTitle, borrowingTitle]]) => {
            expect(translations).toContainEqual(
                expect.objectContaining({ categoryId: LENDING_CATEGORY_ID, language, title: lendingTitle })
            );
            expect(translations).toContainEqual(
                expect.objectContaining({ categoryId: BORROWING_CATEGORY_ID, language, title: borrowingTitle })
            );
        });
    });

    it('stays a no-op when the migration runs twice', async () => {
        await applyMigration(MIGRATION_FILE);

        expect(await fetchDebtSystemCategories()).toHaveLength(2);
        expect(await fetchDebtSystemTranslations()).toHaveLength(10);
    });

    it('offers both categories in the picker while keeping transfer plumbing hidden', async () => {
        const pickable = await categoryRepository.findBySearchQuery('', true, LanguageEnum.EN);
        const pickableIds = pickable.map(category => category.id);
        const pickableTitles = pickable.map(category => category.title);

        expect(pickableIds).toContain(LENDING_CATEGORY_ID);
        expect(pickableIds).toContain(BORROWING_CATEGORY_ID);
        expect(pickableTitles).not.toContain('Currency Transfer');
        expect(pickableTitles).not.toContain('Crypto Transfer');
        expect(pickableTitles).not.toContain('Stock Transfer');
        expect(pickableTitles).not.toContain('Currency Purchase');
    });

    it('finds the localized title through the picker search', async () => {
        const results = await categoryRepository.findBySearchQuery('Надані', true, LanguageEnum.UK);

        expect(results.map(category => category.id)).toContain(LENDING_CATEGORY_ID);
        expect(results.find(category => category.id === LENDING_CATEGORY_ID)?.title).toBe('Надані позики');
    });

    it('never offers system categories as AI suggestion candidates', async () => {
        const candidates = await categoryRepository.findAllNonSystemLocalized(LanguageEnum.EN);

        expect(candidates.map(category => category.id)).not.toContain(LENDING_CATEGORY_ID);
        expect(candidates.map(category => category.id)).not.toContain(BORROWING_CATEGORY_ID);
        expect(candidates.every(category => !category.isSystemCategory)).toBe(true);
    });
});
