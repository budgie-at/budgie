import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import Toast from 'react-native-toast-message';

import { Button } from '../../../@generic/components/button/button';
import { ConfirmActionBottomSheet } from '../../../@generic/components/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { accountService } from '../../service/account.service';

interface Props {
    readonly accountId: number;
}

export const ArchiveAccount = ({ accountId }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();

    const handleArchive = async () => {
        try {
            await accountService.archiveById(accountId);
            ref.current?.close();
            dismissAllOrReplace('/');
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: t`Could not archive account. Please try again later`
            });
        }
    };

    const handleOpen = () => ref.current?.open();

    return (
        <>
            <Button onPress={handleOpen} size="sm" variant="dark-warning" content={t`Archive Account`} leftIcon="Archive" />

            <ConfirmActionBottomSheet
                ref={ref}
                variant="dark-warning"
                description={t`This account will be hidden from your main view and won't be included in totals. \n\n 💡 You can restore it anytime from Settings → Archived Accounts`}
                buttonText={t`Archive`}
                onSubmit={handleArchive}
                icon="Archive"
                title={t`Archive Account?`}
            />
        </>
    );
};
