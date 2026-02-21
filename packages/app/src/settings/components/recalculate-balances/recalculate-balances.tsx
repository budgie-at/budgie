import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
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

        setIsLoading(true);
        try {
            await accountBalanceIncrementalService.updateAllBalances(true);
        } catch (error) {
            showErrorToast(t`Error`, getErrorMessage(error));
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
