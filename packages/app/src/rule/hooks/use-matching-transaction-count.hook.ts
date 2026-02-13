import { RuleConditionCreateInputInterface, RuleConditionMatchTypeEnum } from '@budgie/contracts';
import { useEffect, useRef, useState } from 'react';

import { emptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ruleEngineService } from '../service/rule-engine.service';

const DEBOUNCE_MS = 300;

interface UseMatchingTransactionCountParams {
    readonly conditions: RuleConditionCreateInputInterface[];
    readonly conditionMatchType: RuleConditionMatchTypeEnum;
    readonly enabled: boolean;
}

interface UseMatchingTransactionCountReturn {
    readonly count: number | null;
    readonly isLoading: boolean;
}

export const useMatchingTransactionCount = (params: UseMatchingTransactionCountParams): UseMatchingTransactionCountReturn => {
    const { conditions, conditionMatchType, enabled } = params;
    const [result, setResult] = useState<number | null>(null);
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
            const fetchCount = async (): Promise<void> => {
                const count = await ruleEngineService.countMatchingTransactions({ conditions, conditionMatchType });

                if (requestIdRef.current === currentRequestId) {
                    setResult(count);
                }
            };

            void fetchCount();
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
        };
    }, [hasConditions, conditions, conditionMatchType]);

    const count = hasConditions ? result : null;
    const isLoading = hasConditions && !isDefined(count);

    return { count, isLoading };
};
