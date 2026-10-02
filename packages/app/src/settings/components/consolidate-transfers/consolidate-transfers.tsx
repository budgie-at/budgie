import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { TransferConsolidationService } from '../../../sync/service/transfer-consolidation.service';
import { useConfirmedSettingsAction } from '../../hook/use-confirmed-settings-action.hook';
import { SettingsCard } from '../settings-card/settings-card';

const showConsolidationSuccessToast = (consolidated: number, found: number, t: ReturnType<typeof useLingui>['t']): void => {
    const foundPairsText = t({
        message: plural(found, {
            one: '# high-confidence match',
            other: '# high-confidence matches'
        })
    });

    Toast.show({
        type: 'success',
        text1: t`Matches consolidated`,
        text2: t`Merged ${consolidated} of ${foundPairsText}.`
    });
};

export const ConsolidateTransfers = () => {
    const { t } = useLingui();
    const { isLoading, run } = useConfirmedSettingsAction(
        {
            title: t`Consolidate Matches`,
            message: t`Budgie will merge high-confidence transfer and refund matches. Ambiguous matches stay unchanged.`,
            confirmText: t`Consolidate`,
            cancelText: t`Cancel`
        },
        t`Could not consolidate matches`
    );

    const handleConsolidate = () =>
        run(
            Effect.flatMap(TransferConsolidationService, transferConsolidationService =>
                transferConsolidationService.consolidate(null)
            ).pipe(Effect.map(({ consolidated, found }) => void showConsolidationSuccessToast(consolidated, found, t)))
        );

    return (
        <SettingsCard
            onPress={handleConsolidate}
            title={t`Consolidate Matches`}
            description={t`Merge matching transfers and refunds`}
            icon={UserIconNameEnum.ArrowLeftRight}
            variant="positive"
            isLoading={isLoading}
            testID={SettingsPageSelector.ConsolidateTransfersCard}
        />
    );
};
