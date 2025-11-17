import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS, IconName } from '../../../@generic/constant/icons.constant';
import { SettingsCard } from '../settings-card/settings-card';

import type { CircleIconVariant } from '../../../@generic/type/circle-icon-variant.type';

interface SelectorCardProps {
    readonly title: string;
    readonly icon: IconName;
    readonly onPress: EmptyFn;
    readonly description: string;
    readonly iconVariant?: CircleIconVariant;
}

export const GenericSelectorCard = ({ title, description, icon, iconVariant = 'default', onPress }: SelectorCardProps) => (
    <SettingsCard
        right={
            <View className="ml-auto">
                <Icon className="text-primary" icon={ICONS.ChevronRight} />
            </View>
        }
        left={<CircleIcon icon={ICONS[icon]} variant={iconVariant} size="1_5xl" border={false} />}
        onPress={onPress}
        title={title}
        description={description}
    />
);
