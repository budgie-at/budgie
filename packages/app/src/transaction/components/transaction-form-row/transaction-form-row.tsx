import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { use } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';
import { TransactionFormRowStackedContext } from '../../context/transaction-form-row-stacked.context';
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

const labelVariants = cva('shrink-0', {
    variants: {
        isStacked: { true: 'text-[13px] leading-[18px]', false: 'text-[17px] leading-[22px]' },
        isAction: { true: 'text-primary', false: 'text-secondary-foreground' }
    }
});

export const TransactionFormRow = (props: Props) => {
    const { left, label, value, placeholder, valueTestID, onPress, testID, pressableProps } = props;
    const { fontScale } = useWindowDimensions();
    const isStackedByLayout = use(TransactionFormRowStackedContext);
    const isLargeText = fontScale >= TRANSACTION_LARGE_TEXT_SCALE;
    const isStacked = isLargeText || isStackedByLayout;
    const isAction = !isNotEmptyString(value) && !isDefined(placeholder);
    const labelMaxFontScale = isLargeText ? STACKED_LABEL_MAX_FONT_SCALE : LABEL_MAX_FONT_SCALE;
    const stackedLeading = isLargeText ? null : <View className="self-start pt-[2px]">{left}</View>;
    const leading = isStacked ? stackedLeading : left;
    const chevronSize = 16 * Math.min(fontScale, CHEVRON_MAX_SCALE);
    const titleClassName = isStacked ? 'min-w-0 items-start gap-y-xxs' : 'min-w-0 flex-row items-center gap-x-lg';

    return (
        <GroupedListRow
            left={leading}
            title={
                <View className={titleClassName}>
                    <Text className={labelVariants({ isStacked, isAction })} maxFontSizeMultiplier={labelMaxFontScale}>
                        {label}
                    </Text>
                    <TransactionFormRowValue
                        value={value}
                        placeholder={placeholder}
                        isStacked={isStacked}
                        isLargeText={isLargeText}
                        testID={valueTestID}
                    />
                </View>
            }
            right={<Icon icon={UserIconNameEnum.ChevronRight} size={chevronSize} className="text-secondary-foreground" />}
            onPress={onPress}
            testID={testID}
            pressableProps={pressableProps}
        />
    );
};
