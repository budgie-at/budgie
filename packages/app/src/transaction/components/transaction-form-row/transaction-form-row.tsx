import { UserIconNameEnum } from '@budgie/contracts';
import { Text, useWindowDimensions, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';

import type { ComponentProps, ReactNode } from 'react';

interface Props {
    readonly left: ReactNode;
    readonly label: string;
    readonly value?: string;
    readonly placeholder?: string;
    readonly valueTestID?: string;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly pressableProps?: ComponentProps<typeof GroupedListRow>['pressableProps'];
}

export const TransactionFormRow = (props: Props) => {
    const { left, label, value, placeholder, valueTestID, onPress, testID, pressableProps } = props;
    const { fontScale } = useWindowDimensions();
    const isStacked = fontScale >= TRANSACTION_LARGE_TEXT_SCALE;
    const displayValue = isNotEmptyString(value) ? value : placeholder;
    const valueLineCount = isStacked ? 3 : 1;
    const chevron = <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />;
    const valueText = isNotEmptyString(displayValue) ? (
        <Text
            className={cn('shrink text-[17px] leading-[22px] text-secondary-foreground', !isStacked && 'text-right')}
            numberOfLines={valueLineCount}
            testID={valueTestID}
        >
            {displayValue}
        </Text>
    ) : null;

    if (isStacked) {
        return (
            <GroupedListRow
                left={left}
                title={
                    <View className="min-w-0 items-start gap-y-xxs">
                        <Text className="text-[17px] leading-[22px] text-primary">{label}</Text>
                        {valueText}
                    </View>
                }
                right={chevron}
                onPress={onPress}
                testID={testID}
                pressableProps={pressableProps}
            />
        );
    }

    return (
        <GroupedListRow
            left={left}
            title={
                <Text className="text-[17px] leading-[22px] text-primary" numberOfLines={1}>
                    {label}
                </Text>
            }
            right={
                <View className="max-w-[64%] flex-row items-center gap-x-xs">
                    {valueText}
                    {chevron}
                </View>
            }
            onPress={onPress}
            testID={testID}
            pressableProps={pressableProps}
        />
    );
};
