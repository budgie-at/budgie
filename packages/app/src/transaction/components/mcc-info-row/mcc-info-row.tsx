import { Text, useWindowDimensions, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { useGetMccCategoryByIdQuery } from '../../../mcc-category/query/use-get-mcc-category-by-id.query';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly children?: ReactNode;
}

const MERCHANT_MAX_FONT_SCALE = 1.6;

export const MccInfoRow = ({ transactionTitle, mccCategoryId, children }: Props) => {
    const { mccCategory } = useGetMccCategoryByIdQuery(mccCategoryId);
    const titleLineCount = useWindowDimensions().fontScale >= TRANSACTION_LARGE_TEXT_SCALE ? 3 : 2;

    return (
        <View className="items-center gap-y-[8px] self-stretch">
            {isNotEmptyString(transactionTitle) ? (
                <Text
                    className="px-[16px] text-center text-[17px] leading-[22px] font-medium text-primary"
                    numberOfLines={titleLineCount}
                    maxFontSizeMultiplier={MERCHANT_MAX_FONT_SCALE}
                >
                    {transactionTitle}
                </Text>
            ) : null}

            <View className="max-w-full flex-row flex-wrap items-center justify-center gap-x-[8px] gap-y-[8px]">
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
            </View>
        </View>
    );
};
