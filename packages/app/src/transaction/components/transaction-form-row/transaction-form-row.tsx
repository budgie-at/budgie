import { UserIconNameEnum } from '@budgie/contracts';
import { Text, useWindowDimensions, View } from 'react-native';

import { isNotEmptyString, isString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';

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

const VALUE_MAX_FONT_SCALE = 2;
const STACKED_LABEL_MAX_FONT_SCALE = 1.3;
const CHEVRON_MAX_SCALE = 1.5;

export const TransactionFormRow = (props: Props) => {
    const { left, label, value, placeholder, valueTestID, onPress, testID, pressableProps } = props;
    const { fontScale } = useWindowDimensions();
    const isStacked = fontScale >= TRANSACTION_LARGE_TEXT_SCALE;
    const hasValue = isNotEmptyString(value);
    const valueLayoutClassName = isStacked ? '' : 'min-w-0 flex-1 text-right';
    const chevronSize = 16 * Math.min(fontScale, CHEVRON_MAX_SCALE);
    const valueLineCount = isStacked ? 3 : 2;
    const labelMaxFontScale = isStacked ? STACKED_LABEL_MAX_FONT_SCALE : VALUE_MAX_FONT_SCALE;
    const chevron = <Icon icon={UserIconNameEnum.ChevronRight} size={chevronSize} className="text-secondary-foreground" />;
    const leading = isStacked ? <View className="self-start pt-[2px]">{left}</View> : left;
    const placeholderText = isString(placeholder) ? (
        <Text
            className={cn('text-[17px] leading-[22px] text-secondary-foreground', valueLayoutClassName)}
            maxFontSizeMultiplier={VALUE_MAX_FONT_SCALE}
            numberOfLines={1}
        >
            {placeholder}
        </Text>
    ) : (
        placeholder
    );
    const valueText = hasValue ? (
        <Text
            className={cn('text-[17px] leading-[22px] text-primary', valueLayoutClassName)}
            maxFontSizeMultiplier={VALUE_MAX_FONT_SCALE}
            numberOfLines={valueLineCount}
            testID={valueTestID}
        >
            {value}
        </Text>
    ) : (
        placeholderText
    );
    const labelText = (
        <Text className="shrink-0 text-[17px] leading-[22px] text-secondary-foreground" maxFontSizeMultiplier={labelMaxFontScale}>
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

    return (
        <GroupedListRow left={leading} title={title} right={chevron} onPress={onPress} testID={testID} pressableProps={pressableProps} />
    );
};
