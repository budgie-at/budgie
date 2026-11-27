import { UserIconNameEnum } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/ledger';
import { TransferConsolidationDrainerService } from '@budgie/sync';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useConfirmedSettingsAction } from '../../hook/use-confirmed-settings-action.hook';
import { SettingsActionRow } from '../settings-action-row/settings-action-row';

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
            Effect.gen(function* () {
                const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
                const transferConsolidationService = yield* TransferConsolidationService;

                yield* transferConsolidationDrainerService.cancelPending();

                const { consolidated, found } = yield* transferConsolidationService.consolidate(null);

                showConsolidationSuccessToast(consolidated, found, t);
            })
        );

    const handlePress = () => void handleConsolidate();

    return (
        <SettingsActionRow
            onPress={handlePress}
            title={t`Merge transfers`}
            subtitle={t`Pair transfers and refunds`}
            icon={UserIconNameEnum.ArrowLeftRight}
            isLoading={isLoading}
            testID={SettingsPageSelector.ConsolidateTransfersCard}
        />
    );
};
