import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxCluster } from '../../hook/use-categorize-inbox-cluster.hook';
import { CategorizeInboxGroupFinding } from '../categorize-inbox-group-finding/categorize-inbox-group-finding';
import { CategorizeInboxGroupNextButton } from '../categorize-inbox-group-next-button/categorize-inbox-group-next-button';
import { CategorizeInboxGroupOptions } from '../categorize-inbox-group-options/categorize-inbox-group-options';
import { CategorizeInboxGroupPanel } from '../categorize-inbox-group-panel/categorize-inbox-group-panel';
import { CategorizeInboxGroupPosition } from '../categorize-inbox-group-position/categorize-inbox-group-position';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';
import { CategorizeInboxScreenScroll } from '../categorize-inbox-screen-scroll/categorize-inbox-screen-scroll';
import { CategorizeInboxScreenTitle } from '../categorize-inbox-screen-title/categorize-inbox-screen-title';

import { CategorizeInboxGroupScreenSelector } from './categorize-inbox-group-screen.selector';

interface Props {
    readonly clusterKey: string;
}

export const CategorizeInboxGroupScreen = ({ clusterKey }: Props) => {
    const { cluster, position, total, nextKey } = useCategorizeInboxCluster(clusterKey);

    if (!isDefined(cluster)) {
        return null;
    }

    return (
        <CategorizeInboxScreenChrome
            headerCenter={<CategorizeInboxGroupPosition position={position} total={total} />}
            headerTrailing={<CategorizeInboxGroupNextButton nextKey={nextKey} />}
        >
            <CategorizeInboxScreenScroll>
                <CategorizeInboxScreenTitle title={cluster.displayTitle} titleTestID={CategorizeInboxGroupScreenSelector.Title}>
                    <CategorizeInboxGroupFinding cluster={cluster} />
                </CategorizeInboxScreenTitle>

                <CategorizeInboxGroupPanel cluster={cluster} />

                <CategorizeInboxGroupOptions cluster={cluster} />
            </CategorizeInboxScreenScroll>
        </CategorizeInboxScreenChrome>
    );
};
