import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useGetMccCategoryByIdQuery } from '../../../mcc-category/query/use-get-mcc-category-by-id.query';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
}

export const MccInfoRow = ({ transactionTitle, mccCategoryId }: Props) => {
    const { mccCategory } = useGetMccCategoryByIdQuery(mccCategoryId);

    const hasTitle = isNotEmptyString(transactionTitle);
    const hasMcc = isDefined(mccCategory);

    if (!hasTitle && !hasMcc) {
        return null;
    }

    return (
        <View className="items-center mx-xl">
            {hasTitle ? <Text className="text-sm text-secondary-foreground font-medium">{transactionTitle}</Text> : null}

            {hasMcc ? (
                <View className="rounded-full py-xs px-md bg-primary/10 border border-primary/20">
                    <Text className="text-primary/80 text-xs font-medium">{mccCategory.shortDescription}</Text>
                </View>
            ) : null}
        </View>
    );
};
