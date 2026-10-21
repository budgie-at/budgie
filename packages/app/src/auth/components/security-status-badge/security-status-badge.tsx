import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { useSetting } from '../../../settings/hook/use-setting.hook';

export const SecurityStatusBadge = () => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');

    const containerClassName = isPinEnabled
        ? 'border-positive-corner bg-positive-background'
        : 'border-secondary-corner bg-secondary-background';
    const colorClassName = isPinEnabled ? 'text-positive-foreground' : 'text-secondary-foreground';
    const icon = isPinEnabled ? UserIconNameEnum.Lock : UserIconNameEnum.LockOpen;
    const label = isPinEnabled ? t`Sealed` : t`Phone lock only`;

    return (
        <View className={cn('flex-row items-center gap-x-xs rounded-full border px-md py-xs', containerClassName)}>
            <Icon icon={icon} size={12} className={colorClassName} />
            <Text className={cn('text-xs font-medium', colorClassName)}>{label}</Text>
        </View>
    );
};
