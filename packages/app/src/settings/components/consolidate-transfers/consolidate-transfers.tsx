import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { transferConsolidationService } from '../../../sync/service/transfer-consolidation.service';
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
    const [isLoading, setIsLoading] = useState(false);

    const handleConsolidate = async () => {
        const confirmed = await confirmAlert({
            title: t`Consolidate Matches`,
            message: t`Budgie will merge high-confidence transfer and refund matches. Ambiguous matches stay unchanged.`,
            confirmText: t`Consolidate`,
            cancelText: t`Cancel`
        });

        if (!confirmed) {
            return;
        }

        setIsLoading(true);

        await appRuntime.runPromise(
            transferConsolidationService.consolidate(null).pipe(
                Effect.map(({ consolidated, found }) => void showConsolidationSuccessToast(consolidated, found, t)),
                Effect.tapCause(Effect.logError),
                Effect.catch(error => Effect.sync(() => void showErrorToast(t`Could not consolidate matches`, getErrorMessage(error)))),
                Effect.ensuring(Effect.sync(() => void setIsLoading(false)))
            )
        );
    };

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
