import { TransactionEntryTypeEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { useEffect, useState } from 'react';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { ConsolidationSourceRowInterface, TransactionConsolidationTypeEnum } from '@budgie/contracts';

const logger = getLogger('useGetConsolidationSourcesQuery');

const fromAccountOf = (entries: readonly ConsolidationSourceRowInterface[]): number | undefined =>
    entries.find(entry => entry.entryType === TransactionEntryTypeEnum.DEBIT)?.accountId;

const toAccountOf = (entries: readonly ConsolidationSourceRowInterface[]): number | undefined =>
    entries.find(entry => entry.entryType === TransactionEntryTypeEnum.CREDIT)?.accountId;

const groupBySourceTransaction = (rows: readonly ConsolidationSourceRowInterface[]): ConsolidationSourceRowInterface[][] => {
    const byTransaction = new Map<number, ConsolidationSourceRowInterface[]>();
    for (const row of rows) {
        const entries = byTransaction.get(row.sourceTransactionId) ?? [];
        byTransaction.set(row.sourceTransactionId, [...entries, row]);
    }

    return [...byTransaction.values()];
};

const orderSourcesByTransferChain = (rows: ConsolidationSourceRowInterface[]): ConsolidationSourceRowInterface[] => {
    const transactions = groupBySourceTransaction(rows);
    const ordered: ConsolidationSourceRowInterface[][] = [];
    let current = transactions.find(entries => {
        const fromAccount = fromAccountOf(entries);

        return isDefined(fromAccount) && !transactions.some(other => toAccountOf(other) === fromAccount);
    });

    while (isDefined(current) && !ordered.includes(current)) {
        ordered.push(current);
        const toAccount = toAccountOf(current);
        if (!isDefined(toAccount)) {
            break;
        }
        current = transactions.find(entries => fromAccountOf(entries) === toAccount);
    }

    return [...ordered, ...transactions.filter(entries => !ordered.includes(entries))].flat();
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
