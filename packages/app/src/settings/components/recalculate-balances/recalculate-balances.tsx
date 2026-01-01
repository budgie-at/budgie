import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { accountBalanceIncrementalService } from '../../../account/service/account-balance-incremental.service';
import { useConfirmAction } from '../../hook/use-confirm-action.hook';
import { SettingsCard } from '../settings-card/settings-card';

export const RecalculateBalances = () => {
    const { t } = useLingui();

    const handleRecalculate = async () => {
        try {
            await accountBalanceIncrementalService.updateAllBalances(true);
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Error`, text2: getErrorMessage(error) });
        }
    };

    const { ref, isLoading, handleOpen, handleConfirm } = useConfirmAction(handleRecalculate);

    return (
        <>
            <SettingsCard
                onPress={handleOpen}
                title={t`Recalculate Balances`}
                description={t`Clear cached balances and recalculate from transactions`}
                icon="RefreshCw"
            />

            <ConfirmActionBottomSheet
                ref={ref}
                isLoading={isLoading}
                variant="destructive"
                description={t`This will clear all cached account balances and recalculate them from your transactions. This may take a moment.`}
                buttonText={t`Recalculate`}
                onSubmit={handleConfirm}
                icon="RefreshCw"
                title={t`Recalculate Balances`}
            />
        </>
    );
};
