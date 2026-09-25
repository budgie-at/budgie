import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxCategoryChips } from '../categorize-inbox-category-chips/categorize-inbox-category-chips';
import { CategorizeInboxClusterCardHeader } from '../categorize-inbox-cluster-card-header/categorize-inbox-cluster-card-header';
import { CategorizeInboxClusterExpandToggle } from '../categorize-inbox-cluster-expand-toggle/categorize-inbox-cluster-expand-toggle';
import { CategorizeInboxClusterRows } from '../categorize-inbox-cluster-rows/categorize-inbox-cluster-rows';

import { CategorizeInboxClusterCardSelector } from './categorize-inbox-cluster-card.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxClusterCard = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const { expandedClusterKey } = useCategorizeInboxContext();

    const isExpanded = expandedClusterKey === cluster.key;
    const rowCountText = t({ message: plural(cluster.rowCount, { one: '# transaction', other: '# transactions' }) });
    const variantsText = t({ message: plural(cluster.variantCount, { one: '+# variant', other: '+# variants' }) });
    const metaText = cluster.variantCount > 1 ? `${rowCountText} · ${variantsText}` : rowCountText;
    const trailingAmount = isDefined(cluster.totalBaseAmount) ? (
        <ProtectedMoney fontSize={16} minFontSize={16} maxFontSize={16} instrumentSymbol={defaultInstrument.symbol}>
            {convertFromMicroUnits(cluster.totalBaseAmount)}
        </ProtectedMoney>
    ) : null;

    return (
        <Card className="gap-y-lg" {...testID(CategorizeInboxClusterCardSelector.Card, cluster.key)}>
            <CategorizeInboxClusterCardHeader title={cluster.displayTitle} subtitle={metaText} trailing={trailingAmount} />

            <CategorizeInboxCategoryChips cluster={cluster} />

            <CategorizeInboxClusterExpandToggle clusterKey={cluster.key} />

            {isExpanded ? <CategorizeInboxClusterRows cluster={cluster} /> : null}
        </Card>
    );
};
