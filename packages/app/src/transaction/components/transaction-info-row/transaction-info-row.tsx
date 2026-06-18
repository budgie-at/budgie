import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

import type { TransactionInfoRowPropsInterface } from '../../interface/transaction-info-row-props.interface';

const rowVariants = cva('flex-row items-center gap-x-xl py-xl', {
    variants: {
        withBottomBorder: {
            false: '',
            true: 'border-b border-secondary-corner'
        }
    }
});

export const TransactionInfoRow = ({
    icon,
    label,
    value,
    description,
    children,
    testID,
    onPress,
    withBottomBorder = true
}: TransactionInfoRowPropsInterface) => {
    const Component = isDefined(onPress) ? HapticPressable : View;
    const hasValue = isNotEmptyString(value);
    const hasChildren = isDefined(children);

    return (
        <Component className={rowVariants({ withBottomBorder })} onPress={onPress} testID={testID}>
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-secondary-background border border-secondary-corner">
                <Icon icon={icon} size={22} className="text-secondary-foreground" />
            </View>

            <View className="flex-1 min-w-0">
                <Text className="text-sm text-secondary-foreground font-medium">{label}</Text>
                {hasValue ? (
                    <Text className="text-md text-primary font-semibold" numberOfLines={2} selectable>
                        {value}
                    </Text>
                ) : null}
                {isNotEmptyString(description) ? (
                    <Text className="text-sm text-secondary-foreground" numberOfLines={1} selectable>
                        {description}
                    </Text>
                ) : null}
                {hasChildren ? <View className="flex-row flex-wrap gap-xs pt-xs">{children}</View> : null}
            </View>

            {isDefined(onPress) ? <Icon icon={UserIconNameEnum.ChevronRight} size={20} className="text-secondary-foreground" /> : null}
        </Component>
    );
};
