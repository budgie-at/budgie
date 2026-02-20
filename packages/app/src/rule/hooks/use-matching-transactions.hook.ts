import {
    RuleConditionCreateInputInterface,
    RuleConditionMatchTypeEnum,
    TransactionWithEntriesMccCategoryEntityInterface
} from '@budgie/contracts';
import { useEffect, useRef, useState } from 'react';

import { emptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ruleEngineService } from '../service/rule-engine.service';

const DEBOUNCE_MS = 300;
const PREVIEW_LIMIT = 5;

interface MatchingTransactionsResult {
    readonly transactions: TransactionWithEntriesMccCategoryEntityInterface[];
    readonly count: number;
}

interface UseMatchingTransactionsParams {
    readonly conditions: RuleConditionCreateInputInterface[];
    readonly conditionMatchType: RuleConditionMatchTypeEnum;
    readonly enabled: boolean;
    readonly limit?: number;
}

interface UseMatchingTransactionsReturn {
    readonly transactions: TransactionWithEntriesMccCategoryEntityInterface[];
    readonly count: number | null;
    readonly isLoading: boolean;
}

// jscpd:ignore-start
export const useMatchingTransactions = (params: UseMatchingTransactionsParams): UseMatchingTransactionsReturn => {
    const { conditions, conditionMatchType, enabled, limit = PREVIEW_LIMIT } = params;
    const [result, setResult] = useState<MatchingTransactionsResult | null>(null);
    const requestIdRef = useRef(0);
    const hasConditions = enabled && isNotEmptyArray(conditions);

    useEffect(() => {
        if (!hasConditions) {
            requestIdRef.current += 1;

            return emptyFn;
        }

        requestIdRef.current += 1;
        const currentRequestId = requestIdRef.current;

        const timer = setTimeout(() => {
            const fetchTransactions = async (): Promise<void> => {
                const response = await ruleEngineService.findMatchingTransactions({ conditions, conditionMatchType }, limit);

                if (requestIdRef.current === currentRequestId) {
                    setResult(response);
                }
            };

            void fetchTransactions();
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
        };
    }, [hasConditions, conditions, conditionMatchType, limit]);
    // jscpd:ignore-end

    const transactions = hasConditions ? (result?.transactions ?? []) : [];
    const count = hasConditions ? (result?.count ?? null) : null;
    const isLoading = hasConditions && !isDefined(result);

    return { transactions, count, isLoading };
};
