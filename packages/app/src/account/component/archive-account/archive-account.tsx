import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
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

    return (
        <HapticPressable onPress={handleArchive} disabled={isLoading} testID={AccountDetailsSelector.ArchiveButton}>
            {isLoading ? <ActivityIndicator /> : <CircleIcon variant="positive" icon={UserIconNameEnum.Archive} />}
        </HapticPressable>
    );
};
