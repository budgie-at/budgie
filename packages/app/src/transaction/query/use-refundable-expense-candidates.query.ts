import { useEffect, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { transactionRefundService } from '../service/transaction-refund.service';

import type { RefundableExpenseCandidateInterface } from '@budgie/contracts';

export const useRefundableExpenseCandidatesQuery = (refundIncomeTransactionId: number, search: string) => {
    const [candidates, setCandidates] = useState<RefundableExpenseCandidateInterface[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        setIsLoading(true);
        void transactionRefundService
            .findRefundableExpenses(refundIncomeTransactionId, search)
            .then(result => {
                if (isMounted) {
                    setCandidates(result);
                    setErrorMessage(null);
                }

                return null;
            })
            .catch((error: unknown) => {
                if (isMounted) {
                    setCandidates([]);
                    setErrorMessage(getErrorMessage(error));
                }

                return null;
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [refundIncomeTransactionId, search]);

    return { candidates, errorMessage, isLoading };
};
