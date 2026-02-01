import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useGetMccCategoryByIdQuery } from '../../../mcc-category/query/use-get-mcc-category-by-id.query';

interface Props {
    readonly mccCategoryId: number | null;
}

export const MccInfoRow = ({ mccCategoryId }: Props) => {
    const { mccCategory } = useGetMccCategoryByIdQuery(mccCategoryId);

    if (!isDefined(mccCategory)) {
        return null;
    }

    return (
        <View className="items-center py-sm">
            <Text className="text-xs text-secondary-foreground">
                <Trans>MCC:</Trans> {mccCategory.shortDescription}
            </Text>
            <Text className="text-xxs text-tertiary-foreground">{mccCategory.fullDescription}</Text>
        </View>
    );
};
