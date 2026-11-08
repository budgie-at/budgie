import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, useWindowDimensions, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as createTestIDProps } from '../../../@generic/utils/test-id.util';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';
import { isCompactTransactionForm } from '../../utils/is-compact-transaction-form.util';
import { TransactionFormRowValue } from '../transaction-form-row-value/transaction-form-row-value';

import type { ComponentProps, ReactElement, ReactNode } from 'react';

interface Props {
    readonly left: ReactNode;
    readonly label: string;
    readonly value?: string;
    readonly placeholder?: string | ReactElement;
    readonly valueProps?: Pick<ComponentProps<typeof TransactionFormRowValue>, 'testID' | 'numberOfLines'>;
    readonly right?: ReactNode;
    readonly testID?: string;
    readonly pressableProps?: ComponentProps<typeof GroupedListRow>['pressableProps'] &
        Pick<ComponentProps<typeof GroupedListRow>, 'onPress'>;
}

const COMPACT_ROW_STYLE = { minHeight: 48, paddingVertical: 7 };
const LABEL_MAX_FONT_SCALE = 2;
const STACKED_LABEL_MAX_FONT_SCALE = 1.6;
const CHEVRON_MAX_SCALE = 1.5;

const labelVariants = cva('shrink-0 text-[17px] leading-[22px]', {
    variants: {
        isAction: { true: 'text-primary', false: 'text-secondary-foreground' }
    }
});

export const TransactionFormRow = (props: Props) => {
    const { left, label, value, placeholder, valueProps, right, testID, pressableProps } = props;
    const onPress = pressableProps?.onPress;
    const { fontScale, height } = useWindowDimensions();
    const isLargeText = fontScale >= TRANSACTION_LARGE_TEXT_SCALE;
    const isAction = !isNotEmptyString(value) && !isDefined(placeholder);
    const labelMaxFontScale = isLargeText && !isAction ? STACKED_LABEL_MAX_FONT_SCALE : LABEL_MAX_FONT_SCALE;
    const leading = isLargeText ? null : left;
    const titleClassName = isLargeText ? 'min-w-0 items-start gap-y-xxs' : 'min-w-0 flex-row items-center gap-x-lg';

    const rowPressableProps = isCompactTransactionForm(fontScale, height)
        ? { ...pressableProps, style: [COMPACT_ROW_STYLE, pressableProps?.style] }
        : pressableProps;
    const chevronSize = 16 * Math.min(fontScale, CHEVRON_MAX_SCALE);
    const accessory =
        right ??
        (isDefined(onPress) ? (
            <Icon icon={UserIconNameEnum.ChevronRight} size={chevronSize} className="text-secondary-foreground" />
        ) : null);

    return (
        <GroupedListRow
            left={leading}
            title={
                <View className={titleClassName}>
                    <Text
                        className={labelVariants({ isAction })}
                        maxFontSizeMultiplier={labelMaxFontScale}
                        {...createTestIDProps(testID, TestIDPartEnum.LABEL)}
                    >
                        {label}
                    </Text>
                    <TransactionFormRowValue
                        value={value}
                        placeholder={placeholder}
                        isStacked={isLargeText}
                        isLargeText={isLargeText}
                        {...valueProps}
                    />
                </View>
            }
            right={accessory}
            onPress={onPress}
            testID={testID}
            pressableProps={rowPressableProps}
        />
    );
};
