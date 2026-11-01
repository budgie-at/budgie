import { UserIconNameEnum } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useConfirmedSettingsAction } from '../../hook/use-confirmed-settings-action.hook';
import { SettingsPillButton } from '../settings-pill-button/settings-pill-button';
import { SettingsRow } from '../settings-row/settings-row';

const showConsolidationSuccessToast = (consolidated: number, found: number, t: ReturnType<typeof useLingui>['t']): void => {
    const foundPairsText = t({
        message: plural(found, {
            one: '# high-confidence match',
            other: '# high-confidence matches'
        })
    });

    Toast.show({
        type: 'success',
        text1: t(msg`Transfers and refunds merged`),
        text2: t(msg`Merged ${consolidated} of ${foundPairsText}.`)
    });
};

export const ConsolidateTransfers = () => {
    const { t } = useLingui();
    const { isLoading, run } = useConfirmedSettingsAction(
        {
            title: t`Merge transfers?`,
            message: t`Budgie will merge high-confidence transfer and refund matches. Ambiguous matches stay unchanged.`,
            confirmText: t`Merge`,
            cancelText: t`Cancel`
        },
        t`Could not merge transfers and refunds`
    );

    const handleConsolidate = () =>
        run(
            Effect.flatMap(TransferConsolidationService, transferConsolidationService =>
                transferConsolidationService.consolidate(null)
            ).pipe(Effect.map(({ consolidated, found }) => void showConsolidationSuccessToast(consolidated, found, t)))
        );

    const handlePress = () => void handleConsolidate();

    return (
        <SettingsRow
            {...(!isLoading && { onPress: handlePress })}
            title={t`Merge transfers`}
            subtitle={t`Pair transfers and refunds`}
            icon={UserIconNameEnum.ArrowLeftRight}
            variant="ghost"
            right={<SettingsPillButton label={t`Merge`} variant="secondary" isLoading={isLoading} />}
            testID={SettingsPageSelector.ConsolidateTransfersCard}
        />
    );
};
