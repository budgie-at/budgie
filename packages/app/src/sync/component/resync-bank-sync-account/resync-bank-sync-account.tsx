import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

import { Button } from '../../../@generic/component/button/button';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { bankSyncService } from '../../service/bank-sync.service';

interface Props {
    readonly accountId: number;
}

export const ResyncBankSyncAccount = ({ accountId }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleResync = async () => {
        try {
            setIsLoading(true);
            await bankSyncService.resetForResync(accountId);
            ref.current?.close();
            Toast.show({
                type: 'success',
                text1: t`Success`,
                text2: t`Bank sync has been reset. History will be re-synced on next sync.`
            });
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: t`Could not reset sync. Please try again later`
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpen = () => ref.current?.open();

    return (
        <>
            <Button onPress={handleOpen} size="sm" variant="positive" leftIcon={UserIconNameEnum.RotateCw} />

            <ConfirmActionBottomSheet
                ref={ref}
                isLoading={isLoading}
                variant="positive"
                description={t`This will reset the sync history and re-sync all transactions from this bank account. \n\n 💡 Your existing transactions, tags, and categories will be preserved and updated with any new data.`}
                buttonText={t`Re-sync History`}
                onSubmit={handleResync}
                icon={UserIconNameEnum.RotateCw}
                title={t`Re-sync Bank Account?`}
            />
        </>
    );
};
