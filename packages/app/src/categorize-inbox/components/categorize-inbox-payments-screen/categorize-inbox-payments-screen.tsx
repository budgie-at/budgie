import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { useCategorizeInboxCluster } from '../../hook/use-categorize-inbox-cluster.hook';
import { groupCategorizeInboxRowsByMonth } from '../../utils/group-categorize-inbox-rows-by-month.util';
import { CategorizeInboxClusterRow } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row';
import { CategorizeInboxOptionCard } from '../categorize-inbox-option-card/categorize-inbox-option-card';
import { CategorizeInboxPaymentsBar } from '../categorize-inbox-payments-bar/categorize-inbox-payments-bar';
import { CategorizeInboxPaymentsMonth } from '../categorize-inbox-payments-month/categorize-inbox-payments-month';
import { CategorizeInboxPaymentsSelectAll } from '../categorize-inbox-payments-select-all/categorize-inbox-payments-select-all';
import { CategorizeInboxPaymentsSummary } from '../categorize-inbox-payments-summary/categorize-inbox-payments-summary';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';
import { CategorizeInboxScreenScroll } from '../categorize-inbox-screen-scroll/categorize-inbox-screen-scroll';

interface Props {
    readonly clusterKey: string;
}

export const CategorizeInboxPaymentsScreen = ({ clusterKey }: Props) => {
    const { t } = useLingui();
    const cluster = useCategorizeInboxCluster(clusterKey);

    if (!isDefined(cluster)) {
        return null;
    }

    const { displayTitle } = cluster;
    const monthGroups = groupCategorizeInboxRowsByMonth(cluster.rows);
    const isOnePaymentPerMonth = monthGroups.every(group => group.rows.length === 1);
    const paymentRows = isOnePaymentPerMonth
        ? monthGroups
              .flatMap(group => group.rows)
              .map(row => <CategorizeInboxClusterRow key={row.transactionId} row={row} displayTitle={displayTitle} />)
        : monthGroups.map(group => <CategorizeInboxPaymentsMonth key={group.month.getTime()} group={group} displayTitle={displayTitle} />);

    return (
        <GroupedSurface>
            <CategorizeInboxScreenChrome title={t`Choose payments`}>
                <CategorizeInboxScreenScroll>
                    <CategorizeInboxPaymentsSummary cluster={cluster} />

                    <CategorizeInboxPaymentsSelectAll cluster={cluster} />
                    <CategorizeInboxOptionCard>{paymentRows}</CategorizeInboxOptionCard>

                    <Text className="text-secondary-foreground px-3xl pt-md text-[13px]">
                        <Trans>Unchecked payments stay in your inbox.</Trans>
                    </Text>
                </CategorizeInboxScreenScroll>

                <CategorizeInboxPaymentsBar cluster={cluster} />
            </CategorizeInboxScreenChrome>
        </GroupedSurface>
    );
};
