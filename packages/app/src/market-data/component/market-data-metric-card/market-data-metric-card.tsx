import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly value: string;
    readonly className?: string;
    readonly valueClassName?: string;
    readonly testID?: string;
}

const LABEL_TEXT_STYLE = { lineHeight: 14, minHeight: 28 };

export const MarketDataMetricCard = ({ icon, label, value, className, valueClassName, testID }: Props) => (
    <View
        className={cn('border-secondary-corner bg-secondary-background rounded-4xl border p-3xl gap-y-md justify-center', className)}
        testID={testID}
    >
        <View className="flex-row items-start gap-x-sm">
            <Icon icon={icon} size={14} className="text-secondary-foreground mt-xxs" />
            <Text className="text-secondary-foreground text-xs uppercase flex-1" style={LABEL_TEXT_STYLE} numberOfLines={2}>
                {label}
            </Text>
        </View>

        <Text selectable className={cn('text-primary text-lg font-semibold', valueClassName)} numberOfLines={1}>
            {value}
        </Text>
    </View>
);
