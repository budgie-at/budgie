import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxCluster } from '../../hook/use-categorize-inbox-cluster.hook';
import { groupCategorizeInboxRowsByMonth } from '../../utils/group-categorize-inbox-rows-by-month.util';
import { CategorizeInboxPaymentsMonth } from '../categorize-inbox-payments-month/categorize-inbox-payments-month';
import { CategorizeInboxPaymentsSummary } from '../categorize-inbox-payments-summary/categorize-inbox-payments-summary';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';
import { CategorizeInboxScreenScroll } from '../categorize-inbox-screen-scroll/categorize-inbox-screen-scroll';
import { CategorizeInboxScreenTitle } from '../categorize-inbox-screen-title/categorize-inbox-screen-title';

interface Props {
    readonly clusterKey: string;
}

export const CategorizeInboxPaymentsScreen = ({ clusterKey }: Props) => {
    const { t } = useLingui();
    const cluster = useCategorizeInboxCluster(clusterKey);

    if (!isDefined(cluster)) {
        return null;
    }

    return (
        <CategorizeInboxScreenChrome>
            <CategorizeInboxScreenScroll>
                <CategorizeInboxScreenTitle title={t`Choose payments`}>
                    <Text className="text-secondary-foreground text-sm" numberOfLines={1}>
                        {cluster.displayTitle}
                    </Text>
                    <CategorizeInboxPaymentsSummary cluster={cluster} />
                </CategorizeInboxScreenTitle>

                {groupCategorizeInboxRowsByMonth(cluster.rows).map(group => (
                    <CategorizeInboxPaymentsMonth key={group.month.getTime()} group={group} displayTitle={cluster.displayTitle} />
                ))}
            </CategorizeInboxScreenScroll>
        </CategorizeInboxScreenChrome>
    );
};
