import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon' | 'type'> {
    readonly className?: string;
    readonly showBackBtn?: boolean;
}

export const AccountHeader = ({ title, icon, type, className, showBackBtn, id }: Props) => {
    const { i18n } = useLingui();

    const goBack = () => void router.back();
    const navigateToEdit = () => void router.push(`/edit-account/${id}`);

    return (
        <View className={cn('flex-row items-center gap-x-xl px-5xl', className)}>
            {showBackBtn ? (
                <HapticPressable className="p-md" onPress={goBack}>
                    <Icon className="text-primary" icon={ICONS.ChevronLeft} size={24} />
                </HapticPressable>
            ) : null}

            <CircleIcon icon={ICONS[icon]} variant="default" size="2xl" className="rounded-3xl" />

            <View className="gap-y-xs">
                <Text className="text-primary font-medium text-3xl">{title}</Text>
                <Text className="uppercase text-default-foreground font-medium text-xs">{i18n.t(ACCOUNT_TYPE[type])}</Text>
            </View>

            <HapticPressable className="ml-auto" onPress={navigateToEdit}>
                <CircleIcon icon={ICONS.EllipsisVertical} variant="ghost" size="lg" border={false} />
            </HapticPressable>
        </View>
    );
};
