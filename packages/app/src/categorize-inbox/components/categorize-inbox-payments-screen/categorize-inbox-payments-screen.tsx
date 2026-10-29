import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxCluster } from '../../hook/use-categorize-inbox-cluster.hook';
import { CategorizeInboxClusterRow } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';
import { CategorizeInboxScreenScroll } from '../categorize-inbox-screen-scroll/categorize-inbox-screen-scroll';
import { CategorizeInboxScreenTitle } from '../categorize-inbox-screen-title/categorize-inbox-screen-title';

interface Props {
    readonly clusterKey: string;
}

export const CategorizeInboxPaymentsScreen = ({ clusterKey }: Props) => {
    const { t } = useLingui();
    const { cluster } = useCategorizeInboxCluster(clusterKey);
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
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>
                            {includedCount} of {rowCount} selected
                        </Trans>
                    </Text>
                </CategorizeInboxScreenTitle>

                {cluster.rows.map(row => (
                    <CategorizeInboxClusterRow key={row.transactionId} row={row} displayTitle={cluster.displayTitle} />
                ))}
            </CategorizeInboxScreenScroll>
        </CategorizeInboxScreenChrome>
    );
};
