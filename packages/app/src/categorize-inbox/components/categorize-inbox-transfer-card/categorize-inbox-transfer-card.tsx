import { useLingui } from '@lingui/react/macro';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxTransferKindEnum } from '../../enum/categorize-inbox-transfer-kind.enum';
import { CategorizeInboxCategoryChips } from '../categorize-inbox-category-chips/categorize-inbox-category-chips';
import { CategorizeInboxClusterCardHeader } from '../categorize-inbox-cluster-card-header/categorize-inbox-cluster-card-header';
import { CategorizeInboxClusterCardSelector } from '../categorize-inbox-cluster-card/categorize-inbox-cluster-card.selector';
import { CategorizeInboxClusterExpandToggle } from '../categorize-inbox-cluster-expand-toggle/categorize-inbox-cluster-expand-toggle';
import { CategorizeInboxClusterRows } from '../categorize-inbox-cluster-rows/categorize-inbox-cluster-rows';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxTransferCard = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { isBusy, expandedClusterKey, convertClusterToTransfer } = useCategorizeInboxContext();

    const handleConvertPress = () => void convertClusterToTransfer(cluster);

    const isExpanded = expandedClusterKey === cluster.key;
    const explanationText =
        cluster.transferKind === CategorizeInboxTransferKindEnum.ATM_WITHDRAWAL
            ? t`Looks like an ATM cash withdrawal`
            : t`Looks like a transfer between cards`;

    return (
        <Card className="gap-y-lg" {...testID(CategorizeInboxClusterCardSelector.Card, cluster.key)}>
            <CategorizeInboxClusterCardHeader title={cluster.displayTitle} subtitle={explanationText} />

            <Button content={t`Convert to transfer`} onPress={handleConvertPress} disabled={isBusy} size="sm" variant="secondary" />

            <CategorizeInboxCategoryChips cluster={cluster} />

            <CategorizeInboxClusterExpandToggle clusterKey={cluster.key} />

            {isExpanded ? <CategorizeInboxClusterRows cluster={cluster} /> : null}
        </Card>
    );
};
