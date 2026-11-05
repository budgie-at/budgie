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

const MAX_FONT_SCALE = 2;

export const TransactionFormRow = (props: Props) => {
    const { left, label, value, placeholder, valueTestID, onPress, testID, pressableProps } = props;
    const { fontScale } = useWindowDimensions();
    const isStacked = fontScale >= TRANSACTION_LARGE_TEXT_SCALE;
    const hasValue = isNotEmptyString(value);
    const displayValue = hasValue ? value : placeholder;
    const valueLineCount = isStacked ? 3 : 1;
    const chevron = <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />;
    const valueText = isNotEmptyString(displayValue) ? (
        <Text
            className={cn(
                'text-[17px] leading-[22px]',
                hasValue && 'text-primary',
                !hasValue && 'text-secondary-foreground',
                !isStacked && 'min-w-0 flex-1 text-right'
            )}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            numberOfLines={valueLineCount}
            testID={valueTestID}
        >
            {displayValue}
        </Text>
    ) : null;
    const labelText = (
        <Text className="shrink-0 text-[17px] leading-[22px] text-secondary-foreground" maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {label}
        </Text>
    );
    const title = isStacked ? (
        <View className="min-w-0 items-start gap-y-xxs">
            {labelText}
            {valueText}
        </View>
    ) : (
        <View className="min-w-0 flex-row items-center gap-x-lg">
            {labelText}
            {valueText}
        </View>
    );

    return <GroupedListRow left={left} title={title} right={chevron} onPress={onPress} testID={testID} pressableProps={pressableProps} />;
};
