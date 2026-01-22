import { LanguageEnum } from '@budgie/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { ExpenseTypeMappingInterface } from '../interface/expense-type-mapping.interface';
import { CategoryForMappingInterface, categoryMappingService } from '../service/category-mapping.service';

import { useLlm } from './use-llm.hook';

interface UseCategoryMappingReturnInterface {
    mapping: ExpenseTypeMappingInterface[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useCategoryMapping = (
    categories: CategoryForMappingInterface[],
    language: LanguageEnum
): UseCategoryMappingReturnInterface => {
    const [mapping, setMapping] = useState<ExpenseTypeMappingInterface[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const llm = useLlm({ systemPrompt: '' });
    const llmRef = useRef(llm);
    llmRef.current = llm;

    const loadMapping = useCallback(async () => {
        if (categories.length === 0 || !llmRef.current.isReady) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await categoryMappingService.getMapping(categories, language, llmRef.current);
            setMapping(result);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [categories, language]);

    useEffect(() => {
        void loadMapping();
    }, [loadMapping, llm.isReady]);

    const refresh = useCallback(async () => {
        await categoryMappingService.invalidateCache();
        await loadMapping();
    }, [loadMapping]);

    return { mapping, isLoading, error, refresh };
};
