import { UserIconNameEnum } from '@budgie/contracts';
import { ComponentProps } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HorizontalCell } from '../horizontal-cell/horizontal-cell';
import { Icon } from '../icon/icon';

interface Props extends Omit<ComponentProps<typeof HorizontalCell>, 'children'> {
    readonly title?: string;
    readonly description?: string;
    readonly disabled?: boolean;
}

export const SimpleHorizontalCell = (props: Props) => {
    const { onPress, title, description, disabled = false, ...rest } = props;

    const right = isDefined(onPress) ? (
        <View className="ml-auto">
            <Icon className="text-primary" icon={UserIconNameEnum.ChevronRight} size={20} />
        </View>
    ) : null;

    return (
        <HorizontalCell right={right} {...(!disabled && { onPress })} {...rest}>
            {isNotEmptyString(title) ? (
                <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                    {title}
                </Text>
            ) : null}

            {isNotEmptyString(description) ? (
                <Text className="text-sm font-medium text-secondary-foreground" numberOfLines={1}>
                    {description}
                </Text>
            ) : null}
        </HorizontalCell>
    );
};
