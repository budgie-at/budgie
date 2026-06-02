import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { bankSyncRepairService } from '../../sync/service/bank-sync-repair.service';

const getRepairedTransactionText = (count: number, t: ReturnType<typeof useLingui>['t']) =>
    t({
        message: plural(count, {
            one: '# bank sync item repaired',
            other: '# bank sync items repaired'
        })
    });

const removeDuplicatesAndRefresh = async (refresh: () => Promise<void>, t: ReturnType<typeof useLingui>['t']): Promise<void> => {
    const result = await bankSyncRepairService.removeDuplicates();
    const repairedText = getRepairedTransactionText(result.repairedTransactionCount, t);

    Toast.show({ type: 'success', text1: t`Bank sync data repaired`, text2: repairedText });
    await refresh();
};

export const useBankSyncRepairsAction = (refresh: () => Promise<void>) => {
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

    const handleRepairSuccess = (): null => {
        setIsConfirmingRepair(false);

        return null;
    };

    const handleRepairError = (error: unknown): null => {
        Toast.show({ type: 'error', text1: t`Could not repair bank sync data`, text2: getErrorMessage(error) });

        return null;
    };

    const handleRepairComplete = (): null => {
        isRepairingRef.current = false;
        setIsRepairing(false);

        return null;
    };

    const handleConfirmRepair = () => {
        if (isRepairingRef.current) {
            return;
        }

        isRepairingRef.current = true;
        setIsRepairing(true);

        void removeDuplicatesAndRefresh(refresh, t).then(handleRepairSuccess, handleRepairError).finally(handleRepairComplete);
    };

    return {
        handleCancelConfirmation,
        handleConfirmRepair,
        handleShowConfirmation,
        isConfirmingRepair,
        isRepairing
    };
};
