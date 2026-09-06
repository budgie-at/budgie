import { UserIconNameEnum } from '@budgie/contracts';
import { ActivityIndicator } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useArchiveAccount } from '../../hooks/use-archive-account.hook';

interface Props {
    readonly accountId: number;
}

export const ArchiveAccount = ({ accountId }: Props) => {
    const { handleArchive, isLoading } = useArchiveAccount(accountId, () => void dismissAllOrReplace('/'));

    return (
        <HapticPressable onPress={handleArchive} disabled={isLoading} testID={AccountDetailsSelector.ArchiveButton}>
            {isLoading ? <ActivityIndicator /> : <CircleIcon variant="positive" icon={UserIconNameEnum.Archive} />}
        </HapticPressable>
    );
};
