import { CategorizeInboxSectionEnum } from '@budgie/categorization';

import { useBottomChromeInset } from '@rnw-community/react-native-screen-chrome';
import { isNotEmptyArray } from '@rnw-community/shared';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { LEGEND_LIST_STYLE } from '../../../@generic/constant/legend-list.constant';
import { isCategorizeInboxCluster } from '../../type-guard/is-categorize-inbox-cluster.type-guard';
import { CategorizeInboxGroupRow } from '../categorize-inbox-group-row/categorize-inbox-group-row';
import { CategorizeInboxHero } from '../categorize-inbox-hero/categorize-inbox-hero';
import { CategorizeInboxOneOffsLink } from '../categorize-inbox-one-offs-link/categorize-inbox-one-offs-link';
import { CategorizeInboxSectionHeader } from '../categorize-inbox-section-header/categorize-inbox-section-header';

import type { CategorizeInboxOneOffsLinkItemInterface } from '../../interface/categorize-inbox-one-offs-link-item.interface';
import type { CategorizeInboxListItemType } from '@budgie/categorization';
import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

interface Props {
    readonly items: CategorizeInboxListItemType[];
}

const LIST_BOTTOM_CLEARANCE = 24;

export const CategorizeInboxList = ({ items }: Props) => {
    const { chromeHeight } = useBottomChromeInset();

    const oneOffs = items.filter(isCategorizeInboxCluster).filter(cluster => cluster.section === CategorizeInboxSectionEnum.ONE_OFFS);
    const oneOffsLink: CategorizeInboxOneOffsLinkItemInterface[] = isNotEmptyArray(oneOffs) ? [{ key: 'one-offs-link', oneOffs }] : [];
    const data = [...items.filter(item => item.section !== CategorizeInboxSectionEnum.ONE_OFFS), ...oneOffsLink];

    const keyExtractor = (item: (typeof data)[number]): string => item.key;
    const getItemType = (item: (typeof data)[number]): string => {
        if ('oneOffs' in item) {
            return 'one-offs-link';
        }

        return 'rows' in item ? 'group' : 'header';
    };

    const renderItem = ({ item }: LegendListRenderItemProps<(typeof data)[number]>) => {
        if ('oneOffs' in item) {
            return <CategorizeInboxOneOffsLink oneOffs={item.oneOffs} />;
        }

        if (!('rows' in item)) {
            return <CategorizeInboxSectionHeader section={item.section} rowCount={item.count} />;
        }

        return <CategorizeInboxGroupRow cluster={item} />;
    };

    const stickyHeaderIndices = data.flatMap((item, index) => ('rows' in item || 'oneOffs' in item ? [] : [index]));
    const contentContainerStyle = { paddingBottom: chromeHeight + LIST_BOTTOM_CLEARANCE };

    return (
        <CollapsibleChromeLegendList
            style={LEGEND_LIST_STYLE}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            estimatedItemSize={64}
            getItemType={getItemType}
            stickyHeaderIndices={stickyHeaderIndices}
            drawDistance={600}
            contentContainerStyle={contentContainerStyle}
            ListHeaderComponent={<CategorizeInboxHero />}
        />
    );
};
