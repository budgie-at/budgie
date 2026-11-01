import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { useGetMccCategoryByIdQuery } from '../../../mcc-category/query/use-get-mcc-category-by-id.query';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
}

export const MccInfoRow = ({ transactionTitle, mccCategoryId }: Props) => {
    const { mccCategory } = useGetMccCategoryByIdQuery(mccCategoryId);

    return (
        <>
            {isNotEmptyString(transactionTitle) ? (
                <Text
                    className="shrink text-center text-[15px] leading-[20px] font-medium text-secondary-foreground"
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                    numberOfLines={1}
                >
                    {transactionTitle}
                </Text>
            ) : null}

            {isDefined(mccCategory) ? (
                <View className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-md py-xxs">
                    <Text
                        className="text-xs font-medium text-primary/80"
                        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                        numberOfLines={1}
                    >
                        {mccCategory.shortDescription}
                    </Text>
                </View>
            ) : null}
        </>
    );
};
