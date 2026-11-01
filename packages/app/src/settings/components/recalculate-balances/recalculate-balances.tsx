import { UserIconNameEnum } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useConfirmedSettingsAction } from '../../hook/use-confirmed-settings-action.hook';
import { SettingsPillButton } from '../settings-pill-button/settings-pill-button';
import { SettingsRow } from '../settings-row/settings-row';

export const RecalculateBalances = () => {
    const { t } = useLingui();
    const { isLoading, run } = useConfirmedSettingsAction(
        {
            title: t`Rebuild balances?`,
            message: t`This will clear all cached account balances and recalculate them from your transactions. This may take a moment.`,
            confirmText: t`Rebuild`,
            cancelText: t`Cancel`
        },
        t`Could not rebuild balances`
    );

    const handleRecalculate = () =>
        run(
            Effect.flatMap(AccountBalanceIncrementalService, accountBalanceIncrementalService =>
                accountBalanceIncrementalService.updateAllBalances(true)
            ).pipe(Effect.tap(() => Effect.sync(() => void Toast.show({ type: 'success', text1: t`Balances rebuilt` }))))
        );

    const handlePress = () => void handleRecalculate();

    return (
        <SettingsRow
            {...(!isLoading && { onPress: handlePress })}
            title={t`Rebuild balances`}
            subtitle={t`Recalculate from transactions`}
            icon={UserIconNameEnum.Calculator}
            variant="ghost"
            right={<SettingsPillButton label={t`Rebuild`} variant="secondary" isLoading={isLoading} />}
            testID={SettingsPageSelector.RecalculateBalancesCard}
        />
    );
};
