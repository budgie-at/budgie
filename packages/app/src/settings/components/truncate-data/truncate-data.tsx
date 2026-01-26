import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useConfirmActionModal } from '../../../@generic/context/confirm-action-modal.context';
import { bankSyncRepository } from '../../../@generic/drizzle/db/db';
import { appService } from '../../../@generic/service/app.service';
import { SettingsCard } from '../settings-card/settings-card';

export const TruncateData = () => {
    const { t } = useLingui();
    const { openConfirmAction, updateConfirmActionParams } = useConfirmActionModal();

    const handleTruncate = async () => {
        const confirmed = await openConfirmAction({
            variant: 'destructive',
            icon: UserIconNameEnum.OctagonAlert,
            title: t`Clear All Data`,
            description: t`Are you sure you want to delete all your data? This action cannot be undone.`,
            buttonText: t`Delete data`
        });

        if (!confirmed) {
            return;
        }

        updateConfirmActionParams({ isLoading: true });
        await appService.truncateData();
        await bankSyncRepository.truncate();
    };

    return (
        <SettingsCard
            onPress={handleTruncate}
            title={t`Clear All Data`}
            description={t`Delete all transactions and settings`}
            icon={UserIconNameEnum.Trash2}
            variant="destructive"
        />
    );
};
