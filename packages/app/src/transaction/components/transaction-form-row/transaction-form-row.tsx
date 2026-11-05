import { UserIconNameEnum } from '@budgie/contracts';
import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';
import { TransactionFormRowValue } from '../transaction-form-row-value/transaction-form-row-value';

import type { ComponentProps, ReactElement, ReactNode } from 'react';

interface Props {
    readonly left: ReactNode;
    readonly label: string;
    readonly value?: string;
    readonly placeholder?: string | ReactElement;
    readonly valueTestID?: string;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly pressableProps?: ComponentProps<typeof GroupedListRow>['pressableProps'];
}

const LABEL_MAX_FONT_SCALE = 2;
const STACKED_LABEL_MAX_FONT_SCALE = 1.3;
const CHEVRON_MAX_SCALE = 1.5;

export const TransactionFormRow = (props: Props) => {
    const { left, label, value, placeholder, valueTestID, onPress, testID, pressableProps } = props;
    const { fontScale } = useWindowDimensions();
    const [overflowingValue, setOverflowingValue] = useState<string | null>(null);
    const isLargeText = fontScale >= TRANSACTION_LARGE_TEXT_SCALE;
    const isStacked = isLargeText || (isNotEmptyString(value) && overflowingValue === value);
    const labelMaxFontScale = isLargeText ? STACKED_LABEL_MAX_FONT_SCALE : LABEL_MAX_FONT_SCALE;
    const leading = isLargeText ? null : left;
    const valueNode = (
        <TransactionFormRowValue
            value={value}
            placeholder={placeholder}
            isStacked={isStacked}
            testID={valueTestID}
            onOverflow={setOverflowingValue}
        />
    );
    const labelClassName = isStacked
        ? 'shrink-0 text-[15px] leading-[20px] text-secondary-foreground'
        : 'shrink-0 text-[17px] leading-[22px] text-secondary-foreground';
    const labelText = (
        <Text className={labelClassName} maxFontSizeMultiplier={labelMaxFontScale}>
            {label}
        </Text>
    );
    const chevronSize = 16 * Math.min(fontScale, CHEVRON_MAX_SCALE);
    const titleClassName = isStacked ? 'min-w-0 items-start gap-y-xxs' : 'min-w-0 flex-row items-center gap-x-lg';

    return (
        <GroupedListRow
            left={leading}
            title={
                <View className={titleClassName}>
                    {labelText}
                    {valueNode}
                </View>
            }
            right={<Icon icon={UserIconNameEnum.ChevronRight} size={chevronSize} className="text-secondary-foreground" />}
            onPress={onPress}
            testID={testID}
            pressableProps={pressableProps}
        />
    );
};
