import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { syncRepairService } from '../../sync/service/sync-repair.service';

export const useSyncRepairsAction = (refresh: () => void) => {
    const { t } = useLingui();
    const [isRepairing, setIsRepairing] = useState(false);
    const [isConfirmingRepair, setIsConfirmingRepair] = useState(false);
    const isRepairingRef = useRef(false);

    const handleShowConfirmation = () => {
        setIsConfirmingRepair(true);
    };

    const handleCancelConfirmation = () => {
        if (!isRepairing) {
            setIsConfirmingRepair(false);
        }
    };

    const handleRepairSuccess = (repairedTransactionCount: number) => {
        const repairedText = t({
            message: plural(repairedTransactionCount, { one: '# sync item repaired', other: '# sync items repaired' })
        });

        Toast.show({ type: 'success', text1: t`Sync data repaired`, text2: repairedText });
        refresh();
        setIsConfirmingRepair(false);
    };

    const handleRepairError = (error: unknown) => {
        showErrorToast(t`Could not repair sync data`, getErrorMessage(error));
    };

    const handleConfirmRepair = () => {
        if (isRepairingRef.current) {
            return;
        }

        isRepairingRef.current = true;
        setIsRepairing(true);

        appRuntime.runFork(
            syncRepairService.removeDuplicates().pipe(
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

    return {
        handleCancelConfirmation,
        handleConfirmRepair,
        handleShowConfirmation,
        isConfirmingRepair,
        isRepairing
    };
};
