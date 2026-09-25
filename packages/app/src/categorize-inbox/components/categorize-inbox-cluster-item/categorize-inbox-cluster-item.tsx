import { CategorizeInboxClusterKindEnum } from '../../enum/categorize-inbox-cluster-kind.enum';
import { CategorizeInboxClusterCard } from '../categorize-inbox-cluster-card/categorize-inbox-cluster-card';
import { CategorizeInboxSingleRow } from '../categorize-inbox-single-row/categorize-inbox-single-row';
import { CategorizeInboxTransferCard } from '../categorize-inbox-transfer-card/categorize-inbox-transfer-card';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxClusterItem = ({ cluster }: Props) => {
    if (cluster.kind === CategorizeInboxClusterKindEnum.TRANSFER) {
        return <CategorizeInboxTransferCard cluster={cluster} />;
    }

    if (cluster.rowCount === 1) {
        return <CategorizeInboxSingleRow cluster={cluster} />;
    }

    return <CategorizeInboxClusterCard cluster={cluster} />;
};
