import { CategoryEntityInterface } from '@budgie/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useLlmContext } from '../context/llm.context';
import { generateTranslationAndTags } from '../util/generate-translation-and-tags.util';

interface UseCategoryTagsSyncReturn {
    isProcessing: boolean;
    processedCount: number;
    totalCount: number;
    error: string | null;
}

/* eslint-disable no-console, lingui/no-unlocalized-strings -- Debug logging for tag generation */
const logTagsStart = (count: number): void => {
    console.log('\n🏷️  ═══════════════════════════════════════════════════════════');
    console.log('🏷️  CATEGORY TRANSLATION SYNC STARTED');
    console.log(`🏷️  Categories without translation: ${count}`);
    console.log('🏷️  ═══════════════════════════════════════════════════════════\n');
};

interface LogTranslationParams {
    index: number;
    total: number;
    title: string;
    titleEn: string;
    tags: string;
}

const logTranslation = ({ index, total, title, titleEn, tags }: LogTranslationParams): void => {
    console.log(`🏷️  [${index + 1}/${total}] "${title}"`);
    console.log(`    🌐 ${titleEn}`);
    console.log(`    🔖 ${tags}`);
};

const logTagsComplete = (processedCount: number): void => {
    console.log('\n🏷️  ═══════════════════════════════════════════════════════════');
    console.log('🏷️  CATEGORY TRANSLATION SYNC COMPLETE');
    console.log(`🏷️  Processed: ${processedCount} categories`);
    console.log('🏷️  ═══════════════════════════════════════════════════════════\n');
};

const logAllCategoryTags = (categories: CategoryEntityInterface[]): void => {
    const categoriesWithTags = categories.filter(category => category.titleTags !== null);

    if (categoriesWithTags.length === 0) {
        return;
    }

    console.log('\n📋 ═══════════════════════════════════════════════════════════');
    console.log('📋 ALL CATEGORY TRANSLATIONS');
    console.log('📋 ═══════════════════════════════════════════════════════════');

    for (const category of categoriesWithTags) {
        console.log(`📋 [${category.id}] "${category.title}"`);
        console.log(`    🌐 ${category.titleEn ?? 'N/A'}`);
        console.log(`    🔖 ${category.titleTags}`);
    }

    console.log('📋 ═══════════════════════════════════════════════════════════\n');
};
/* eslint-enable no-console, lingui/no-unlocalized-strings */

export const useCategoryTagsSync = (): UseCategoryTagsSyncReturn => {
    const { llm } = useLlmContext();
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedCount, setProcessedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const hasStartedRef = useRef(false);

    const generateTranslationForCategory = useCallback(
        async (category: CategoryEntityInterface, index: number, total: number): Promise<void> => {
            const result = await generateTranslationAndTags(llm, category.title);

            await categoryRepository.updateTranslation(category.id, result.titleEn, result.titleTags);
            logTranslation({ index, total, title: category.title, titleEn: result.titleEn, tags: result.titleTags });
        },
        [llm]
    );

    // eslint-disable-next-line max-statements -- Sequential tag generation with logging requires multiple statements
    const processAllCategories = useCallback(async (): Promise<void> => {
        setIsProcessing(true);
        setError(null);

        try {
            const categoriesWithoutTags = await categoryRepository.findWithoutTags();
            const categoryCount = categoriesWithoutTags.length;
            setTotalCount(categoryCount);

            if (categoryCount > 0) {
                logTagsStart(categoryCount);

                for (let index = 0; index < categoryCount; index += 1) {
                    const category = categoriesWithoutTags[index];

                    try {
                        // eslint-disable-next-line no-await-in-loop -- Sequential processing to avoid overwhelming LLM
                        await generateTranslationForCategory(category, index, categoryCount);
                        setProcessedCount(index + 1);
                    } catch (categoryError: unknown) {
                        // eslint-disable-next-line no-console, lingui/no-unlocalized-strings -- Debug logging for tag generation errors
                        console.log(`🏷️  ❌ Failed [${category.id}] "${category.title}":`, getErrorMessage(categoryError));
                    }
                }

                logTagsComplete(categoryCount);
            }

            const allCategories = await categoryRepository.findAll();
            logAllCategoryTags(allCategories);
        } catch (syncError: unknown) {
            setError(getErrorMessage(syncError));
            // eslint-disable-next-line no-console, lingui/no-unlocalized-strings -- Debug logging for sync errors
            console.log('🏷️  ❌ SYNC ERROR:', getErrorMessage(syncError));
        } finally {
            setIsProcessing(false);
        }
    }, [generateTranslationForCategory]);

    useEffect(() => {
        if (!llm.isReady || hasStartedRef.current) {
            return;
        }

        hasStartedRef.current = true;
        void processAllCategories();
    }, [llm.isReady, processAllCategories]);

    return { isProcessing, processedCount, totalCount, error };
};
