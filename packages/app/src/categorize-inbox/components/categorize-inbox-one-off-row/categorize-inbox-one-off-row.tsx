import { Link } from 'expo-router';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { getCategorizeInboxRowHref } from '../../utils/get-categorize-inbox-row-href.util';
import { CategorizeInboxClusterRail } from '../categorize-inbox-cluster-rail/categorize-inbox-cluster-rail';
import { CategorizeInboxClusterSummary } from '../categorize-inbox-cluster-summary/categorize-inbox-cluster-summary';

import { CategorizeInboxOneOffRowSelector } from './categorize-inbox-one-off-row.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxOneOffRow = ({ cluster }: Props) => {
    const { formatDayAndMonthAndYear } = useFormatDate();

    const [row] = cluster.rows;

    if (!isDefined(row)) {
        return null;
    }

    return (
        <Card size="sm" className="gap-y-xl p-3xl" {...testID(CategorizeInboxOneOffRowSelector.Row, cluster.key)}>
            <Link href={getCategorizeInboxRowHref(row)} asChild>
                <HapticPressable accessibilityRole="link" {...testID(CategorizeInboxOneOffRowSelector.Open, cluster.key)}>
                    <CategorizeInboxClusterSummary cluster={cluster}>
                        <Text className="text-secondary-foreground text-xs tabular-nums" numberOfLines={1}>
                            {formatDayAndMonthAndYear(row.operatedAt)}
                        </Text>
                    </CategorizeInboxClusterSummary>
                </HapticPressable>
            </Link>

            <CategorizeInboxClusterRail cluster={cluster} />
        </Card>
    );
};
