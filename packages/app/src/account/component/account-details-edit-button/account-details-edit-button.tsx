import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';

interface Props {
    readonly accountId: number;
}

export const AccountDetailsEditButton = ({ accountId }: Props) => {
    const { t } = useLingui();
    const router = useRouter();

    const handlePress = () => void router.navigate({ pathname: '/account/[id]/update', params: { id: String(accountId) } });

    return (
        <HapticPressable
            className="h-10 w-10 items-center justify-center"
            onPress={handlePress}
            testID={AccountDetailsSelector.EditButton}
            nativeID={AccountDetailsSelector.EditButton}
            collapsable={false}
            accessibilityRole="button"
            accessibilityLabel={t`Edit account`}
        >
            <CircleIcon icon={UserIconNameEnum.Pencil} variant="ghost" size={40} iconSize={24} border={false} />
        </HapticPressable>
    );
};
