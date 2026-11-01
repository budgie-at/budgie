import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { iconSearchService } from '@app/@generic/service/icon-search.service';
import { CategoryIconBackfillService } from '@app/category/service/category-icon-backfill.service';
import { createCategory } from '@app/category/utils/create-category.util';
import { getCategoryDisplayIcon } from '@app/category/utils/get-category-display-icon.util';
import { needsIconChoice } from '@app/category/utils/needs-icon-choice.util';
import { updateCategory } from '@app/category/utils/update-category.util';
import { CategoryEntityTable, CategoryIconSourceEnum, CategoryRepository, LanguageEnum, UserIconNameEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer } from '../../harness';

const MIGRATION_NAME = '20261031231028_category_icon_source';
const MIGRATION_SQL = readFileSync(resolve(process.cwd(), '../../packages/app/drizzle', MIGRATION_NAME, 'migration.sql'), 'utf8');
const CREATED_AT = 1_780_000_000;
const NO_TRANSLATION = { titleEn: null, titleTags: null };

const insertLegacyCategory = (title: string, icon: string, isUpdated: boolean) =>
    testDb.$client.unsafe(
        `INSERT INTO categories (title, title_search, icon, created_at, updated_at)
         VALUES ('${title}', '${title.toLowerCase()}', '${icon}', ${CREATED_AT}, ${CREATED_AT + Number(isUpdated)})`
    ).raw;

const findIconSource = (title: string) =>
    Effect.map(
        testDb.select({ iconSource: CategoryEntityTable.iconSource }).from(CategoryEntityTable).where(eq(CategoryEntityTable.title, title)),
        ([row]) => row.iconSource
    );

const findCategory = (id: number) =>
    Effect.flatMap(CategoryRepository, categoryRepository => categoryRepository.findById(id, LanguageEnum.EN)).pipe(
        Effect.map(([category]) => category)
    );

const runBackfill = Effect.flatMap(CategoryIconBackfillService, service => service.applyConfidentIcons()).pipe(
    Effect.provide(CategoryIconBackfillService.layer)
);

describe('category/icon-source', () => {
    it.effect('classifies untouched legacy Home rows as automatic and everything else as chosen', () =>
        Effect.gen(function* () {
            yield* insertLegacyCategory('Side project', UserIconNameEnum.Home, false);
            yield* insertLegacyCategory('Apartment', UserIconNameEnum.Home, true);
            yield* insertLegacyCategory('Coffee runs', UserIconNameEnum.Coffee, false);
            yield* testDb.$client.unsafe('ALTER TABLE categories DROP COLUMN icon_source').raw;

            yield* Effect.forEach(MIGRATION_SQL.split('--> statement-breakpoint'), statement => testDb.$client.unsafe(statement).raw, {
                discard: true
            });

            expect(yield* findIconSource('Side project')).toBe(CategoryIconSourceEnum.AUTO);
            expect(yield* findIconSource('Apartment')).toBe(CategoryIconSourceEnum.USER);
            expect(yield* findIconSource('Coffee runs')).toBe(CategoryIconSourceEnum.USER);
            expect(
                yield* testDb
                    .select({ iconSource: CategoryEntityTable.iconSource })
                    .from(CategoryEntityTable)
                    .where(eq(CategoryEntityTable.isDefault, true))
            ).not.toContainEqual({ iconSource: CategoryIconSourceEnum.AUTO });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a user-chosen Home and backfills a confident automatic Home', () =>
        Effect.gen(function* () {
            const entries = yield* iconSearchService.load();
            const chosen = yield* createCategory(
                { title: 'Apartment', icon: UserIconNameEnum.Home, iconSource: CategoryIconSourceEnum.USER },
                NO_TRANSLATION
            );
            const automatic = yield* createCategory({ title: 'Coffee', icon: UserIconNameEnum.Home }, NO_TRANSLATION);
            const ambiguous = yield* createCategory({ title: 'Side project', icon: UserIconNameEnum.Home }, NO_TRANSLATION);

            yield* runBackfill;

            const [chosenAfter, automaticAfter, ambiguousAfter] = yield* Effect.forEach([chosen, automatic, ambiguous], ({ id }) =>
                findCategory(id)
            );

            expect(chosenAfter).toMatchObject({ icon: UserIconNameEnum.Home, iconSource: CategoryIconSourceEnum.USER });
            expect(needsIconChoice(chosenAfter, entries)).toBe(false);
            expect(getCategoryDisplayIcon(chosenAfter)).toBe(UserIconNameEnum.Home);
            expect(automaticAfter).toMatchObject({ icon: 'reicon:Coffee', iconSource: CategoryIconSourceEnum.AUTO });
            expect(ambiguousAfter).toMatchObject({ icon: UserIconNameEnum.Home, iconSource: CategoryIconSourceEnum.AUTO });
            expect(needsIconChoice(ambiguousAfter, entries)).toBe(true);
            expect(getCategoryDisplayIcon(ambiguousAfter)).toBe(UserIconNameEnum.Folder);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('re-applies a confident icon after an automatic category is renamed', () =>
        Effect.gen(function* () {
            const entries = yield* iconSearchService.load();
            const created = yield* createCategory({ title: 'Side project', icon: UserIconNameEnum.Folder }, NO_TRANSLATION);

            expect(needsIconChoice(created, entries)).toBe(true);

            yield* updateCategory(created.id, { title: 'Coffee', icon: created.icon }, NO_TRANSLATION, LanguageEnum.EN);
            yield* runBackfill;

            expect(yield* findCategory(created.id)).toMatchObject({ icon: 'reicon:Coffee', iconSource: CategoryIconSourceEnum.AUTO });
        }).pipe(Effect.provide(TestLayer))
    );
});
