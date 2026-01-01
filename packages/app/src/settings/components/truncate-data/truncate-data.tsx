import { useLingui } from '@lingui/react/macro';

import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { bankSyncRepository } from '../../../@generic/drizzle/db/db';
import { appService } from '../../../@generic/service/app.service';
import { useConfirmAction } from '../../hook/use-confirm-action.hook';
import { SettingsCard } from '../settings-card/settings-card';

export const TruncateData = () => {
    const { t } = useLingui();

    const handleTruncate = async () => {
        await appService.truncateData();
        await bankSyncRepository.truncate();
    };

    const { ref, isLoading, handleOpen, handleConfirm } = useConfirmAction(handleTruncate);

    return (
        <>
            <SettingsCard
                onPress={handleOpen}
                title={t`Clear All Data`}
                description={t`Delete all transactions and settings`}
                icon="Trash2"
                variant="destructive"
            />

            <ConfirmActionBottomSheet
                ref={ref}
                isLoading={isLoading}
                variant="destructive"
                description={t`Are you sure you want to delete all your data? This action cannot be undone.`}
                buttonText={t`Delete data`}
                onSubmit={handleConfirm}
                icon="OctagonAlert"
                title={t`Clear All Data`}
            />
        </>
    );
};
