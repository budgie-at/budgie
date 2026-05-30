import { TransactionEntryTypeEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { useEffect, useState } from 'react';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { ConsolidationSourceRowInterface, TransactionConsolidationTypeEnum } from '@budgie/contracts';

const logger = getLogger('useGetConsolidationSourcesQuery');

const orderSourcesByTransferChain = (rows: ConsolidationSourceRowInterface[]): ConsolidationSourceRowInterface[] => {
    const sendingAccounts = new Set(rows.filter(row => row.entryType === TransactionEntryTypeEnum.CREDIT).map(row => row.accountId));
    const receivingAccounts = new Set(rows.filter(row => row.entryType === TransactionEntryTypeEnum.DEBIT).map(row => row.accountId));
    const accounts = [...new Set(rows.map(row => row.accountId))];

    const originAccount = accounts.find(accountId => sendingAccounts.has(accountId) && !receivingAccounts.has(accountId));
    const targetAccount = accounts.find(accountId => receivingAccounts.has(accountId) && !sendingAccounts.has(accountId));
    const bridgeAccounts = accounts.filter(accountId => sendingAccounts.has(accountId) && receivingAccounts.has(accountId));
    const chainAccounts = [originAccount, ...bridgeAccounts, targetAccount].filter(isDefined);
    const orderedAccounts = [...chainAccounts, ...accounts.filter(accountId => !chainAccounts.includes(accountId))];

    const rankOf = (row: ConsolidationSourceRowInterface): number => {
        const arrivalBeforeDeparture = row.entryType === TransactionEntryTypeEnum.DEBIT ? 0 : 1;

        return orderedAccounts.indexOf(row.accountId) * 2 + arrivalBeforeDeparture;
    };

    return [...rows].sort((left, right) => rankOf(left) - rankOf(right));
};

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
                setSources(orderSourcesByTransferChain(rows));
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
