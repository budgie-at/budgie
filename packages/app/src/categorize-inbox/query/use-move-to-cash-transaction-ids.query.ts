import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import * as Effect from 'effect/Effect';
import { useEffect, useState } from 'react';

import { appRuntime } from '../../@generic/runtime/app.runtime';

import type { CategorizeInboxRowInterface } from '@budgie/contracts';

export const useMoveToCashTransactionIdsQuery = (rows: readonly CategorizeInboxRowInterface[]): number[] => {
    const [transactionIds, setTransactionIds] = useState<number[]>([]);

    useEffect(() => {
        const fiber = appRuntime.runFork(
            Effect.ignore(
                Effect.tap(
                    Effect.flatMap(ConsolidationCoordinatorService, consolidationCoordinatorService =>
                        consolidationCoordinatorService.findAtmCashWithdrawalTransactionIds(rows.map(row => row.transactionId))
                    ),
                    foundTransactionIds =>
                        Effect.sync(() => {
                            setTransactionIds(foundTransactionIds);
                        })
                )
            )
        );

        return () => {
            fiber.interruptUnsafe();
        };
    }, [rows]);

    return transactionIds;
};
