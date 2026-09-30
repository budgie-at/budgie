import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { AccountBalanceIncrementalService } from '../../../account/service/account-balance-incremental.service';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useConfirmedSettingsAction } from '../../hook/use-confirmed-settings-action.hook';
import { SettingsCard } from '../settings-card/settings-card';

export const RecalculateBalances = () => {
    const { t } = useLingui();
    const { isLoading, run } = useConfirmedSettingsAction(
        {
            title: t`Recalculate Balances`,
            message: t`This will clear all cached account balances and recalculate them from your transactions. This may take a moment.`,
            confirmText: t`Recalculate`,
            cancelText: t`Cancel`,
            isDestructive: true
        },
        t`Could not recalculate balances`
    );

    const handleRecalculate = () =>
        run(
            Effect.flatMap(AccountBalanceIncrementalService, accountBalanceIncrementalService =>
                accountBalanceIncrementalService.updateAllBalances(true)
            )
        );

    return (
        <SettingsCard
            onPress={handleRecalculate}
            title={t`Recalculate Balances`}
            description={t`Clear cached balances and recalculate from transactions`}
            icon={UserIconNameEnum.RefreshCw}
            isLoading={isLoading}
            testID={SettingsPageSelector.RecalculateBalancesCard}
        />
    );
};
