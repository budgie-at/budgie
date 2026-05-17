import { getLogger } from '@budgie/logger';
import { useEffect, useState } from 'react';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { ConsolidationSourceRowInterface, TransactionConsolidationTypeEnum } from '@budgie/contracts';

const logger = getLogger('useGetConsolidationSourcesQuery');

export const useGetConsolidationSourcesQuery = (transactionId: number) => {
    const language = useSetting('language');
    const [sources, setSources] = useState<ConsolidationSourceRowInterface[]>([]);
    const [consolidationType, setConsolidationType] = useState<TransactionConsolidationTypeEnum | null>(null);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const handleError = (caughtError: unknown) => {
            logger.error('failed', { transactionId, errorMessage: getErrorMessage(caughtError) });
            if (isActive) {
                setHasError(true);
                setSources([]);
                setIsLoading(false);
            }
        };

        const fetchData = async (): Promise<void> => {
            const [rows, canonical] = await Promise.all([
                transactionRepository.findConsolidationSources(transactionId),
                transactionRepository.getById(transactionId, language)
            ]);
            if (isActive) {
                setSources(rows);
                setConsolidationType(isDefined(canonical) ? canonical.consolidationType : null);
                setHasError(false);
                setIsLoading(false);
            }
        };

        void fetchData().catch(handleError);

        return () => {
            isActive = false;
        };
    }, [transactionId, language]);

    return { sources, consolidationType, hasError, isLoading };
};
