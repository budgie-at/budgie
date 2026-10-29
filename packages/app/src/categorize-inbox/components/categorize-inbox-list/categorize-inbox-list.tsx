import { CategorizeInboxSectionEnum } from '@budgie/categorization';

import { useBottomChromeInset } from '@rnw-community/react-native-screen-chrome';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { LEGEND_LIST_STYLE } from '../../../@generic/constant/legend-list.constant';
import { CategorizeInboxGroupRow } from '../categorize-inbox-group-row/categorize-inbox-group-row';
import { CategorizeInboxHero } from '../categorize-inbox-hero/categorize-inbox-hero';
import { CategorizeInboxOneOffsLink } from '../categorize-inbox-one-offs-link/categorize-inbox-one-offs-link';
import { CategorizeInboxSectionHeader } from '../categorize-inbox-section-header/categorize-inbox-section-header';

import type { CategorizeInboxListItemType } from '@budgie/categorization';
import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

interface Props {
    readonly items: CategorizeInboxListItemType[];
}

const LIST_BOTTOM_CLEARANCE = 24;

export const CategorizeInboxList = ({ items }: Props) => {
    const { chromeHeight } = useBottomChromeInset();

    const data = items.filter(item => item.section !== CategorizeInboxSectionEnum.ONE_OFFS);

    const keyExtractor = (item: CategorizeInboxListItemType): string => item.key;
    const getItemType = (item: CategorizeInboxListItemType): string => ('rows' in item ? 'group' : 'header');

    const renderItem = ({ item }: LegendListRenderItemProps<CategorizeInboxListItemType>) => {
        if (!('rows' in item)) {
            return <CategorizeInboxSectionHeader section={item.section} rowCount={item.count} />;
        }

        return <CategorizeInboxGroupRow cluster={item} />;
    };

    const stickyHeaderIndices = data.flatMap((item, index) => ('rows' in item ? [] : [index]));
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
            ListFooterComponent={<CategorizeInboxOneOffsLink />}
        />
    );
};
