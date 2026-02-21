import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { transferConsolidationService } from '../../../sync/service/transfer-consolidation.service';
import { SettingsCard } from '../settings-card/settings-card';

export const ConsolidateTransfers = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleConsolidate = async () => {
        const confirmed = await confirmAlert({
            title: t`Consolidate Transfers`,
            message: t`This will find matching income and expense transactions from your synced bank accounts and consolidate them into proper transfer transactions. The process preserves all transaction data and external IDs.`,
            confirmText: t`Consolidate`,
            cancelText: t`Cancel`
        });

        if (!confirmed) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await transferConsolidationService.consolidate();

            const { found, consolidated } = result;

            if (found === 0) {
                Toast.show({ type: 'info', text1: t`No matches`, text2: t`No transfer pairs found to consolidate` });
            } else {
                Toast.show({
                    type: 'success',
                    text1: t`Success`,
                    text2: t`Consolidated ${consolidated} of ${found} pairs`
                });
            }
        } catch (error) {
            showErrorToast(t`Error`, getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsCard
            onPress={handleConsolidate}
            title={t`Consolidate Transfers`}
            description={t`Convert matching income/expense pairs from synced accounts into transfer transactions`}
            icon={UserIconNameEnum.GitMerge}
            variant="positive"
            isLoading={isLoading}
        />
    );
};
