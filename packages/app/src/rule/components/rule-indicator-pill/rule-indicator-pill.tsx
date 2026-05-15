import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

import type { RuleIndicatorPillPropsInterface } from '../../interface/rule-indicator-pill-props.interface';

const ICON_SIZE = 14;
const baseClassName = 'flex-row items-center gap-xs rounded-full border border-secondary-corner bg-secondary-background px-md py-xs';
const baseIconClassName = 'text-secondary-foreground';
const baseTextClassName = 'text-xs text-secondary-foreground font-medium shrink';

export const RuleIndicatorPill = (props: RuleIndicatorPillPropsInterface) => {
    const { children, icon, className, iconClassName, textClassName, trailingContent } = props;

    return (
        <View className={cn(baseClassName, className)}>
            <Icon icon={icon} size={ICON_SIZE} className={cn(baseIconClassName, iconClassName)} />
            <Text className={cn(baseTextClassName, textClassName)} numberOfLines={1} ellipsizeMode="tail">
                {children}
            </Text>
            {trailingContent}
        </View>
    );
};
