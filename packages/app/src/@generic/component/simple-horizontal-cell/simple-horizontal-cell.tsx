import { ComponentProps } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { IconName, ICONS } from '../../constant/icons.constant';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HorizontalCell } from '../horizontal-cell/horizontal-cell';
import { Icon } from '../icon/icon';

interface Props extends Omit<ComponentProps<typeof HorizontalCell>, 'children'> {
    readonly title: string;
    readonly icon: IconName;
    readonly description: string;
    readonly iconParams?: Omit<ComponentProps<typeof CircleIcon>, 'icon'>;
}

export const SimpleHorizontalCell = ({ onPress, icon, title, description, iconParams, ...rest }: Props) => {
    const right = isDefined(onPress) ? (
        <View className="ml-auto">
            <Icon className="text-primary" icon={ICONS.ChevronRight} />
        </View>
    ) : null;

    return (
        <HorizontalCell left={<CircleIcon icon={ICONS[icon]} {...iconParams} />} onPress={onPress} right={right} {...rest}>
            <Text className="text-sm font-medium text-primary">{title}</Text>
            <Text className="text-sm font-medium text-secondary-foreground">{description}</Text>
        </HorizontalCell>
    );
};
