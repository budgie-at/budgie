import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ConfirmActionBottomSheet } from '../../../@generic/components/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { appService } from '../../../@generic/service/app.service';
import { SettingsCard } from '../settings-card/settings-card';

export const TruncateData = () => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useLingui();

    const handleOpen = () => void ref.current?.open();

    const handleTruncate = async () => {
        try {
            setIsLoading(true);
            await appService.truncateData();
            ref.current?.close();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <SettingsCard
                onPress={handleOpen}
                title={t`Clear All Data`}
                description={t`Delete all transactions and settings`}
                left={<CircleIcon size="1_5xl" icon={ICONS.Trash2} variant="destructive" border={false} />}
            />

            <ConfirmActionBottomSheet
                ref={ref}
                isLoading={isLoading}
                variant="destructive"
                description={t`Are you sure you want to delete all your data? This action cannot be undone.`}
                buttonText={t`Delete data`}
                onSubmit={handleTruncate}
                icon="OctagonAlert"
                title={t`Clear All Data`}
            />
        </>
    );
};
