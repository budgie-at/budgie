import { getLogger } from '@budgie/logger';
import { useEffect, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';

import type { ConsolidationSourceRowInterface } from '@budgie/contracts';

const logger = getLogger('useGetConsolidationSourcesQuery');

export const useGetConsolidationSourcesQuery = (transactionId: number) => {
    const [sources, setSources] = useState<ConsolidationSourceRowInterface[]>([]);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const handleSuccess = (rows: ConsolidationSourceRowInterface[]) => {
            if (isActive) {
                setSources(rows);
                setHasError(false);
                setIsLoading(false);
            }
        };

        const handleError = (caughtError: unknown) => {
            logger.error('failed', { transactionId, errorMessage: getErrorMessage(caughtError) });
            if (isActive) {
                setHasError(true);
                setSources([]);
                setIsLoading(false);
            }
        };

        void transactionRepository.findConsolidationSources(transactionId).then(handleSuccess).catch(handleError);

        return () => {
            isActive = false;
        };
    }, [transactionId]);

    return { sources, hasError, isLoading };
};
