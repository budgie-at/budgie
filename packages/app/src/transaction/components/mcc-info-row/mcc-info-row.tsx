import { Text, useWindowDimensions, View } from 'react-native';
import Animated, { LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { useGetMccCategoryByIdQuery } from '../../../mcc-category/query/use-get-mcc-category-by-id.query';
import { isCompactTransactionForm } from '../../utils/is-compact-transaction-form.util';
import { QuickFormContext } from '../quick-form-context/quick-form-context';
import { QuickFormValidationSlot } from '../quick-form-validation-slot/quick-form-validation-slot';

import type { ReactElement, ReactNode } from 'react';

interface Props {
    readonly transactionTitle: string | ReactElement;
    readonly mccCategoryId: number | null;
    readonly children?: ReactNode;
    readonly suggestions?: ReactNode;
}

const MERCHANT_MAX_FONT_SCALE = 1.35;
const LAYOUT = LinearTransition.duration(200).reduceMotion(ReduceMotion.System);

export const MccInfoRow = ({ transactionTitle, mccCategoryId, children, suggestions }: Props) => {
    const { mccCategory } = useGetMccCategoryByIdQuery(mccCategoryId);
    const { fontScale, height } = useWindowDimensions();
    const isCompact = isCompactTransactionForm(fontScale, height);
    const merchantClassName = isCompact
        ? 'h-[44px] items-center justify-center self-stretch'
        : 'h-[60px] items-center justify-center self-stretch';
    const accessoryClassName = isCompact
        ? 'h-[32px] self-stretch flex-row items-center justify-center gap-x-[8px] overflow-hidden'
        : 'max-h-[44px] self-stretch flex-row items-center justify-center gap-x-[8px] overflow-hidden';

    return (
        <QuickFormContext>
            <Animated.View layout={LAYOUT} className="items-center self-stretch">
                <View className={merchantClassName}>
                    {isNotEmptyString(transactionTitle) ? (
                        <Text
                            className="px-[16px] text-center text-[17px] leading-[22px] font-medium text-primary"
                            numberOfLines={2}
                            maxFontSizeMultiplier={MERCHANT_MAX_FONT_SCALE}
                        >
                            {transactionTitle}
                        </Text>
                    ) : (
                        transactionTitle
                    )}
                </View>
                <View className={accessoryClassName}>
                    {isDefined(mccCategory) ? (
                        <Text
                            className="shrink text-[13px] leading-[18px] text-secondary-foreground"
                            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                            numberOfLines={1}
                        >
                            {mccCategory.shortDescription}
                        </Text>
                    ) : null}
                    {children}
                    {suggestions}
                </View>
                <QuickFormValidationSlot />
            </Animated.View>
        </QuickFormContext>
    );
};
