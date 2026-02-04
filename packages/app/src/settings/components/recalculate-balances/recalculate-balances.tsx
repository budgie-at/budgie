import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { accountBalanceIncrementalService } from '../../../account/service/account-balance-incremental.service';
import { SettingsCard } from '../settings-card/settings-card';

export const RecalculateBalances = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleRecalculate = async () => {
        const confirmed = await confirmAlert({
            title: t`Recalculate Balances`,
            message: t`This will clear all cached account balances and recalculate them from your transactions. This may take a moment.`,
            confirmText: t`Recalculate`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!confirmed) {
            return;
        }

        try {
            setIsLoading(true);
            await accountBalanceIncrementalService.updateAllBalances(true);
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Error`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsCard
            onPress={handleRecalculate}
            title={t`Recalculate Balances`}
            description={t`Clear cached balances and recalculate from transactions`}
            icon={UserIconNameEnum.RefreshCw}
            isLoading={isLoading}
        />
    );
};
