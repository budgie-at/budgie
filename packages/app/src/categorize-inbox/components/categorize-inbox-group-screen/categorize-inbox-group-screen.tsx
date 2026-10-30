import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxCluster } from '../../hook/use-categorize-inbox-cluster.hook';
import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { CategorizeInboxGroupFinding } from '../categorize-inbox-group-finding/categorize-inbox-group-finding';
import { CategorizeInboxGroupOptions } from '../categorize-inbox-group-options/categorize-inbox-group-options';
import { CategorizeInboxGroupPanel } from '../categorize-inbox-group-panel/categorize-inbox-group-panel';
import { CategorizeInboxGroupRefineOptions } from '../categorize-inbox-group-refine-options/categorize-inbox-group-refine-options';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';
import { CategorizeInboxScreenScroll } from '../categorize-inbox-screen-scroll/categorize-inbox-screen-scroll';
import { CategorizeInboxScreenTitle } from '../categorize-inbox-screen-title/categorize-inbox-screen-title';

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
        <CategorizeInboxScreenChrome>
            <CategorizeInboxScreenScroll>
                <CategorizeInboxScreenTitle
                    title={formatCategorizeInboxMerchantTitle(cluster.displayTitle)}
                    titleTestID={CategorizeInboxGroupScreenSelector.Title}
                >
                    <CategorizeInboxGroupFinding cluster={cluster} />
                </CategorizeInboxScreenTitle>

                <CategorizeInboxGroupOptions cluster={cluster} />

                <CategorizeInboxGroupPanel cluster={cluster} />

                <CategorizeInboxGroupRefineOptions cluster={cluster} />
            </CategorizeInboxScreenScroll>
        </CategorizeInboxScreenChrome>
    );
};
