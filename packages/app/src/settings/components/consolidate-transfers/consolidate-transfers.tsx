import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { transferConsolidationService } from '../../../sync/service/transfer-consolidation.service';
import { useConfirmAction } from '../../hook/use-confirm-action.hook';
import { SettingsCard } from '../settings-card/settings-card';

export const ConsolidateTransfers = () => {
    const { t } = useLingui();

    const handleConsolidate = async () => {
        try {
            await transferConsolidationService.consolidate();

            Toast.show({ type: 'success', text1: t`Success`, text2: t`Transfer consolidation completed` });
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Error`, text2: getErrorMessage(error) });
        }
    };

    const { ref, isLoading, handleOpen, handleConfirm } = useConfirmAction(handleConsolidate);

    return (
        <>
            <SettingsCard
                onPress={handleOpen}
                title={t`Consolidate Transfers`}
                description={t`Convert matching income/expense pairs from synced accounts into transfer transactions`}
                icon={UserIconNameEnum.GitMerge}
                variant="positive"
            />

            <ConfirmActionBottomSheet
                ref={ref}
                isLoading={isLoading}
                variant="default"
                description={t`This will find matching income and expense transactions from your synced bank accounts and consolidate them into proper transfer transactions. The process preserves all transaction data and external IDs.`}
                buttonText={t`Consolidate`}
                onSubmit={handleConfirm}
                icon={UserIconNameEnum.GitMerge}
                title={t`Consolidate Transfers`}
            />
        </>
    );
};
