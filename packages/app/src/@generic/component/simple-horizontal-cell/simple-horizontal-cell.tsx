import { ComponentProps } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { IconName } from '../../constant/icons.constant';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HorizontalCell } from '../horizontal-cell/horizontal-cell';
import { Icon } from '../icon/icon';

interface Props extends Omit<ComponentProps<typeof HorizontalCell>, 'children'> {
    readonly title?: string;
    readonly icon?: IconName;
    readonly description?: string;
    readonly iconParams?: Omit<ComponentProps<typeof CircleIcon>, 'icon'>;
    readonly disabled?: boolean;
}

export const SimpleHorizontalCell = ({ onPress, icon, title, description, iconParams, disabled = false, ...rest }: Props) => {
    const right = isDefined(onPress) ? (
        <View className="ml-auto">
            <Icon className="text-primary" icon="ChevronRight" size={20} />
        </View>
    ) : null;

    const left = isDefined(icon) ? <CircleIcon icon={icon} {...iconParams} /> : null;

    return (
        <HorizontalCell left={left} right={right} {...(!disabled && { onPress })} {...rest}>
            {isNotEmptyString(title) ? <Text className="text-sm font-medium text-primary">{title}</Text> : null}

            {isNotEmptyString(description) ? <Text className="text-sm font-medium text-secondary-foreground">{description}</Text> : null}
        </HorizontalCell>
    );
};
