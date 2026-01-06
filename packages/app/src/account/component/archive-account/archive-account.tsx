import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { Button } from '../../../@generic/component/button/button';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { microPause } from '../../../@generic/utils/micro-pause.util';
import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';
import { accountService } from '../../service/account.service';

interface Props {
    readonly accountId: number;
}

export const ArchiveAccount = ({ accountId }: Props) => {
    const { t } = useLingui();

    const handleArchive = async () => {
        try {
            await microPause();
            await accountService.archiveById(accountId);
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: t`Could not archive account. Please try again later`
            });
        }
    };

    const { ref, isLoading, handleOpen, handleConfirm } = useConfirmAction(handleArchive, '/');

    return (
        <>
            <Button onPress={handleOpen} size="sm" variant="dark-warning" leftIcon={UserIconNameEnum.Archive} />

            <ConfirmActionBottomSheet
                ref={ref}
                isLoading={isLoading}
                variant="dark-warning"
                description={t`This account will be hidden from your main view and won't be included in totals. \n\n 💡 You can restore it anytime from Settings → Archived Accounts`}
                buttonText={t`Archive`}
                onSubmit={handleConfirm}
                icon={UserIconNameEnum.Archive}
                title={t`Archive Account?`}
            />
        </>
    );
};
