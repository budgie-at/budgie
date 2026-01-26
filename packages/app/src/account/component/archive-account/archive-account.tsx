import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { Button } from '../../../@generic/component/button/button';
import { useConfirmActionModal } from '../../../@generic/context/confirm-action-modal.context';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { microPause } from '../../../@generic/utils/micro-pause.util';
import { accountService } from '../../service/account.service';

interface Props {
    readonly accountId: number;
}

export const ArchiveAccount = ({ accountId }: Props) => {
    const { t } = useLingui();
    const { openConfirmAction, updateConfirmActionParams } = useConfirmActionModal();

    const handleArchive = async () => {
        const confirmed = await openConfirmAction({
            variant: 'dark-warning',
            icon: UserIconNameEnum.Archive,
            title: t`Archive Account?`,
            description: t`This account will be hidden from your main view and won't be included in totals. \n\n 💡 You can restore it anytime from Settings → Archived Accounts`,
            buttonText: t`Archive`
        });

        if (!confirmed) {
            return;
        }

        try {
            updateConfirmActionParams({ isLoading: true });
            await microPause();
            await accountService.archiveById(accountId);
            dismissAllOrReplace('/');
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: t`Could not archive account. Please try again later`
            });
        }
    };

    return <Button onPress={handleArchive} size="sm" variant="dark-warning" leftIcon={UserIconNameEnum.Archive} />;
};
