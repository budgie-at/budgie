import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

export const AccountEditButton = ({ id }: Pick<AccountEntityInterface, 'id'>) => {
    const { t } = useLingui();

    const navigateToEditAccount = () => void router.push({ pathname: '/account/[id]/update', params: { id: String(id) } });

    return (
        <HapticPressable
            className="-mr-xs size-[28px] flex-row items-center justify-center gap-[2px] rounded-full active:bg-secondary-background"
            onPress={navigateToEditAccount}
            accessibilityRole="button"
            accessibilityLabel={t`Edit account`}
        >
            <View className="size-[3px] rounded-full bg-secondary-foreground" />
            <View className="size-[3px] rounded-full bg-secondary-foreground" />
            <View className="size-[3px] rounded-full bg-secondary-foreground" />
        </HapticPressable>
    );
};
