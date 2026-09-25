import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { CategorizeInboxCategoryChips } from '../categorize-inbox-category-chips/categorize-inbox-category-chips';
import { CategorizeInboxClusterCardSelector } from '../categorize-inbox-cluster-card/categorize-inbox-cluster-card.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxSingleRow = ({ cluster }: Props) => {
    const [row] = cluster.rows;

    if (!isDefined(row)) {
        return null;
    }

    return (
        <Card size="sm" className="gap-y-md" {...testID(CategorizeInboxClusterCardSelector.Card, cluster.key)}>
            <View className="flex-row items-center justify-between gap-x-lg">
                <Text className="text-primary text-sm flex-1" numberOfLines={1}>
                    {cluster.displayTitle}
                </Text>

                <ProtectedMoney fontSize={14} minFontSize={14} maxFontSize={14} instrumentSymbol={row.instrumentSymbol}>
                    {convertFromMicroUnits(row.amount)}
                </ProtectedMoney>
            </View>

            <CategorizeInboxCategoryChips cluster={cluster} />
        </Card>
    );
};
