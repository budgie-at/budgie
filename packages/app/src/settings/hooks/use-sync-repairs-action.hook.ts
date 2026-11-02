import { SyncRepairService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRef, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';

export const useSyncRepairsAction = (refresh: () => void) => {
    const { t } = useLingui();
    const [isRepairing, setIsRepairing] = useState(false);
    const isRepairingRef = useRef(false);
    const [repairedTransactionCount, setRepairedTransactionCount] = useState<number | null>(null);

    const handleRepairSuccess = (count: number) => {
        setRepairedTransactionCount(count);
        refresh();
    };

    const handleRepairError = (error: unknown) => {
        showErrorToast(t`Could not repair sync data`, getErrorMessage(error));
    };

    const handleRepair = () => {
        if (isRepairingRef.current) {
            return;
        }

        isRepairingRef.current = true;
        setIsRepairing(true);

        appRuntime.runFork(
            Effect.flatMap(SyncRepairService, syncRepairService => syncRepairService.removeDuplicates()).pipe(
                Effect.match({
                    onSuccess: result => void handleRepairSuccess(result.repairedTransactionCount),
                    onFailure: handleRepairError
                }),
                Effect.ensuring(
                    Effect.sync(() => {
                        isRepairingRef.current = false;
                        setIsRepairing(false);
                    })
                )
            )
        );
    };

    return { handleRepair, isRepairing, repairedTransactionCount };
};
