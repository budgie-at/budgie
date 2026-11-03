import { isDefined } from '@rnw-community/shared';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { useCategorizeInboxCluster } from '../../hook/use-categorize-inbox-cluster.hook';
import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { CategorizeInboxCollapsingNavTitle } from '../categorize-inbox-collapsing-nav-title/categorize-inbox-collapsing-nav-title';
import { CategorizeInboxGroupChoiceProvider } from '../categorize-inbox-group-choice-provider/categorize-inbox-group-choice-provider';
import { CategorizeInboxGroupHero } from '../categorize-inbox-group-hero/categorize-inbox-group-hero';
import { CategorizeInboxGroupOptions } from '../categorize-inbox-group-options/categorize-inbox-group-options';
import { CategorizeInboxGroupPanel } from '../categorize-inbox-group-panel/categorize-inbox-group-panel';
import { CategorizeInboxGroupPrimaryBar } from '../categorize-inbox-group-primary-bar/categorize-inbox-group-primary-bar';
import { CategorizeInboxGroupRecentPayments } from '../categorize-inbox-group-recent-payments/categorize-inbox-group-recent-payments';
import { CategorizeInboxGroupRefineOptions } from '../categorize-inbox-group-refine-options/categorize-inbox-group-refine-options';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';
import { CategorizeInboxScreenScroll } from '../categorize-inbox-screen-scroll/categorize-inbox-screen-scroll';

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
            <CategorizeInboxGroupChoiceProvider cluster={cluster}>
                <CategorizeInboxScreenChrome
                    title={
                        <CategorizeInboxCollapsingNavTitle>
                            {formatCategorizeInboxMerchantTitle(cluster.displayTitle)}
                        </CategorizeInboxCollapsingNavTitle>
                    }
                >
                    <CategorizeInboxScreenScroll>
                        <CategorizeInboxGroupHero cluster={cluster} />

                        <CategorizeInboxGroupOptions cluster={cluster} />

                        <CategorizeInboxGroupRefineOptions cluster={cluster} />

                        <CategorizeInboxGroupPanel cluster={cluster} />

                        <CategorizeInboxGroupRecentPayments cluster={cluster} />
                    </CategorizeInboxScreenScroll>

                    <CategorizeInboxGroupPrimaryBar cluster={cluster} />
                </CategorizeInboxScreenChrome>
            </CategorizeInboxGroupChoiceProvider>
        </GroupedSurface>
    );
};
