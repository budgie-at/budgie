import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { bankSyncRepository } from '../../../@generic/drizzle/db/db';
import { appService } from '../../../@generic/service/app.service';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { SettingsCard } from '../settings-card/settings-card';

export const TruncateData = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleTruncate = async () => {
        const confirmed = await confirmAlert({
            title: t`Clear All Data`,
            message: t`Are you sure you want to delete all your data? This action cannot be undone.`,
            confirmText: t`Delete data`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!confirmed) {
            return;
        }

        setIsLoading(true);
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
            isLoading={isLoading}
        />
    );
};
