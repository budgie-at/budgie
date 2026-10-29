import { CategorizeInboxSectionEnum } from '@budgie/categorization';

import { useBottomChromeInset } from '@rnw-community/react-native-screen-chrome';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { LEGEND_LIST_CONTENT_GAP, LEGEND_LIST_STYLE } from '../../../@generic/constant/legend-list.constant';
import { CategorizeInboxClusterCard } from '../categorize-inbox-cluster-card/categorize-inbox-cluster-card';
import { CategorizeInboxHero } from '../categorize-inbox-hero/categorize-inbox-hero';
import { CategorizeInboxOneOffRow } from '../categorize-inbox-one-off-row/categorize-inbox-one-off-row';
import { CategorizeInboxSectionHeader } from '../categorize-inbox-section-header/categorize-inbox-section-header';

import type { CategorizeInboxListItemType } from '@budgie/categorization';
import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

interface Props {
    readonly items: CategorizeInboxListItemType[];
}

const LIST_BOTTOM_CLEARANCE = 24;

export const CategorizeInboxList = ({ items }: Props) => {
    const { chromeHeight } = useBottomChromeInset();

    const keyExtractor = (item: CategorizeInboxListItemType): string => item.key;
    const getItemType = (item: CategorizeInboxListItemType): string => ('rows' in item ? item.section : item.key);

    const renderItem = ({ item }: LegendListRenderItemProps<CategorizeInboxListItemType>) => {
        if (!('rows' in item)) {
            return <CategorizeInboxSectionHeader section={item.section} rowCount={item.count} totalBaseAmount={item.totalBaseAmount} />;
        }

        return item.section === CategorizeInboxSectionEnum.ONE_OFFS ? (
            <CategorizeInboxOneOffRow cluster={item} />
        ) : (
            <CategorizeInboxClusterCard cluster={item} />
        );
    };

    const stickyHeaderIndices = items.flatMap((item, index) => ('rows' in item ? [] : [index]));
    const contentContainerStyle = { gap: LEGEND_LIST_CONTENT_GAP, paddingBottom: chromeHeight + LIST_BOTTOM_CLEARANCE };

    return (
        <CollapsibleChromeLegendList
            style={LEGEND_LIST_STYLE}
            data={items}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            estimatedItemSize={150}
            getItemType={getItemType}
            stickyHeaderIndices={stickyHeaderIndices}
            drawDistance={600}
            contentContainerStyle={contentContainerStyle}
            ListHeaderComponent={<CategorizeInboxHero items={items} />}
        />
    );
};
