import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { useConfirmActionModal } from '../../../@generic/context/confirm-action-modal.context';
import { accountBalanceIncrementalService } from '../../../account/service/account-balance-incremental.service';
import { SettingsCard } from '../settings-card/settings-card';

export const RecalculateBalances = () => {
    const { t } = useLingui();
    const { openConfirmAction, updateConfirmActionParams } = useConfirmActionModal();

    const handleRecalculate = async () => {
        const confirmed = await openConfirmAction({
            variant: 'destructive',
            icon: UserIconNameEnum.RefreshCw,
            title: t`Recalculate Balances`,
            description: t`This will clear all cached account balances and recalculate them from your transactions. This may take a moment.`,
            buttonText: t`Recalculate`
        });

        if (!confirmed) {
            return;
        }

        try {
            updateConfirmActionParams({ isLoading: true });
            await accountBalanceIncrementalService.updateAllBalances(true);
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Error`, text2: getErrorMessage(error) });
        }
    };

    return (
        <SettingsCard
            onPress={handleRecalculate}
            title={t`Recalculate Balances`}
            description={t`Clear cached balances and recalculate from transactions`}
            icon={UserIconNameEnum.RefreshCw}
        />
    );
};
