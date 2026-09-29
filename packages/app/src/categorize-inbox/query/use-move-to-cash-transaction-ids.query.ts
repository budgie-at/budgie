import { useEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { consolidationCoordinatorService } from '../../sync/service/consolidation-coordinator.service';

import type { CategorizeInboxRowInterface } from '@budgie/contracts';

export const useMoveToCashTransactionIdsQuery = (rows: readonly CategorizeInboxRowInterface[]): number[] => {
    const [transactionIds, setTransactionIds] = useState<number[]>([]);

    useEffect(() => {
        let isActive = true;

        consolidationCoordinatorService
            .findAtmCashWithdrawalTransactionIds(rows.map(row => row.transactionId))
            .then(foundTransactionIds => {
                if (isActive) {
                    setTransactionIds(foundTransactionIds);
                }

                return foundTransactionIds;
            })
            .catch(emptyFn);

        return () => {
            isActive = false;
        };
    }, [rows]);

    return transactionIds;
};
