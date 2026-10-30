import { isDefined } from '@rnw-community/shared';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { useCategorizeInboxCluster } from '../../hook/use-categorize-inbox-cluster.hook';
import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { CategorizeInboxGroupHero } from '../categorize-inbox-group-hero/categorize-inbox-group-hero';
import { CategorizeInboxGroupOptions } from '../categorize-inbox-group-options/categorize-inbox-group-options';
import { CategorizeInboxGroupPanel } from '../categorize-inbox-group-panel/categorize-inbox-group-panel';
import { CategorizeInboxGroupRecentPayments } from '../categorize-inbox-group-recent-payments/categorize-inbox-group-recent-payments';
import { CategorizeInboxGroupRefineOptions } from '../categorize-inbox-group-refine-options/categorize-inbox-group-refine-options';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';
import { CategorizeInboxScreenScroll } from '../categorize-inbox-screen-scroll/categorize-inbox-screen-scroll';

import { CategorizeInboxGroupScreenSelector } from './categorize-inbox-group-screen.selector';

interface Props {
    readonly clusterKey: string;
}

export const CategorizeInboxGroupScreen = ({ clusterKey }: Props) => {
    const cluster = useCategorizeInboxCluster(clusterKey);

    if (!isDefined(cluster)) {
        return null;
    }

    return (
        <GroupedSurface>
            <CategorizeInboxScreenChrome
                title={formatCategorizeInboxMerchantTitle(cluster.displayTitle)}
                titleTestID={CategorizeInboxGroupScreenSelector.Title}
            >
                <CategorizeInboxScreenScroll>
                    <CategorizeInboxGroupHero cluster={cluster} />

                    <CategorizeInboxGroupOptions cluster={cluster} />

                    <CategorizeInboxGroupRefineOptions cluster={cluster} />

                    <CategorizeInboxGroupPanel cluster={cluster} />

                    <CategorizeInboxGroupRecentPayments cluster={cluster} />
                </CategorizeInboxScreenScroll>
            </CategorizeInboxScreenChrome>
        </GroupedSurface>
    );
};
