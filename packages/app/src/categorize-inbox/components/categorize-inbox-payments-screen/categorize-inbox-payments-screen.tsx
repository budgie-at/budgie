import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxCluster } from '../../hook/use-categorize-inbox-cluster.hook';
import { groupCategorizeInboxRowsByMonth } from '../../utils/group-categorize-inbox-rows-by-month.util';
import { CategorizeInboxPaymentsMonth } from '../categorize-inbox-payments-month/categorize-inbox-payments-month';
import { CategorizeInboxPaymentsSelectAll } from '../categorize-inbox-payments-select-all/categorize-inbox-payments-select-all';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';
import { CategorizeInboxScreenScroll } from '../categorize-inbox-screen-scroll/categorize-inbox-screen-scroll';
import { CategorizeInboxScreenTitle } from '../categorize-inbox-screen-title/categorize-inbox-screen-title';

interface Props {
    readonly clusterKey: string;
}

export const CategorizeInboxPaymentsScreen = ({ clusterKey }: Props) => {
    const { t } = useLingui();
    const cluster = useCategorizeInboxCluster(clusterKey);
    const { includedRows } = useCategorizeInboxContext();

    if (!isDefined(cluster)) {
        return null;
    }

    const includedCount = includedRows(cluster).length;
    const rowCount = cluster.rows.length;

    return (
        <CategorizeInboxScreenChrome>
            <CategorizeInboxScreenScroll>
                <CategorizeInboxScreenTitle title={t`Choose payments`}>
                    <View className="flex-row items-center justify-between gap-x-md">
                        <Text className="text-secondary-foreground text-sm">
                            <Trans>
                                {includedCount} of {rowCount} selected
                            </Trans>
                        </Text>
                        <CategorizeInboxPaymentsSelectAll cluster={cluster} />
                    </View>
                </CategorizeInboxScreenTitle>

                {groupCategorizeInboxRowsByMonth(cluster.rows).map(group => (
                    <CategorizeInboxPaymentsMonth key={group.month.getTime()} group={group} displayTitle={cluster.displayTitle} />
                ))}
            </CategorizeInboxScreenScroll>
        </CategorizeInboxScreenChrome>
    );
};
