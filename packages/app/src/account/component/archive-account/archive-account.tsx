import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { accountService } from '../../service/account.service';

interface Props {
    readonly accountId: number;
}

export const ArchiveAccount = ({ accountId }: Props) => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleArchive = async () => {
        const confirmed = await confirmAlert({
            title: t`Archive Account?`,
            message: t`This account will be hidden from your main view and won't be included in totals. You can restore it anytime from Settings → Archived Accounts.`,
            confirmText: t`Archive`,
            cancelText: t`Cancel`,
            isDestructive: false
        });

        if (!confirmed) {
            return;
        }

        setIsLoading(true);
        try {
            await accountService.archiveById(accountId);
            dismissAllOrReplace('/');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: getErrorMessage(error)
            });
        } finally {
            setIsLoading(false);
        }
    };

    return <Button onPress={handleArchive} size="sm" variant="dark-warning" leftIcon={UserIconNameEnum.Archive} isLoading={isLoading} />;
};
