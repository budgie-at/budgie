import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { CategorizeInboxSuggestionChips } from '../categorize-inbox-suggestion-chips/categorize-inbox-suggestion-chips';

import { CategorizeInboxOneOffRowSelector } from './categorize-inbox-one-off-row.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxOneOffRow = ({ cluster }: Props) => {
    const { formatDayAndMonthAndYear } = useFormatDate();
    const protectAmount = useProtectedAmountLabel();

    const [row] = cluster.rows;

    if (!isDefined(row)) {
        return null;
    }

    return (
        <Card size="sm" className="gap-y-md" {...testID(CategorizeInboxOneOffRowSelector.Row, cluster.key)}>
            <View className="flex-row items-center gap-x-xl">
                <Text className="text-primary text-sm font-semibold flex-1" numberOfLines={1}>
                    {cluster.displayTitle}
                </Text>
                <Text className="text-primary text-sm font-semibold">
                    {protectAmount(convertFromMicroUnits(row.amount), row.instrumentSymbol)}
                </Text>
            </View>

            <View className="flex-row items-center gap-x-sm">
                <CategorizeInboxSuggestionChips cluster={cluster} />
                <Text className="text-secondary-foreground text-xs flex-1 text-right" numberOfLines={1}>
                    {formatDayAndMonthAndYear(row.operatedAt)}
                </Text>
            </View>
        </Card>
    );
};
