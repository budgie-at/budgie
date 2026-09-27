import { BudgieLegendList } from '../../../@generic/component/budgie-legend-list/budgie-legend-list';
import { LEGEND_LIST_CONTENT_GAP, LEGEND_LIST_STYLE } from '../../../@generic/constant/legend-list.constant';
import { CATEGORIZE_INBOX_LIST_SIZING } from '../../constant/categorize-inbox-list-sizing.constant';
import { CategorizeInboxListItemKindEnum } from '../../enum/categorize-inbox-list-item-kind.enum';
import { CategorizeInboxClusterCard } from '../categorize-inbox-cluster-card/categorize-inbox-cluster-card';
import { CategorizeInboxOneOffRow } from '../categorize-inbox-one-off-row/categorize-inbox-one-off-row';
import { CategorizeInboxSectionHeader } from '../categorize-inbox-section-header/categorize-inbox-section-header';

import type { CategorizeInboxListItemType } from '../../type/categorize-inbox-list-item.type';
import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

interface Props {
    readonly items: CategorizeInboxListItemType[];
    readonly expandedClusterKey: string | null;
}

const CONTENT_CONTAINER_STYLE = { gap: LEGEND_LIST_CONTENT_GAP, paddingBottom: LEGEND_LIST_CONTENT_GAP };

export const CategorizeInboxList = ({ items, expandedClusterKey }: Props) => {
    const keyExtractor = (item: CategorizeInboxListItemType): string => item.key;

    const renderItem = ({ item }: LegendListRenderItemProps<CategorizeInboxListItemType>) => {
        switch (item.kind) {
            case CategorizeInboxListItemKindEnum.SECTION_HEADER:
                return <CategorizeInboxSectionHeader section={item.section} rowCount={item.count} totalBaseAmount={item.totalBaseAmount} />;
            case CategorizeInboxListItemKindEnum.ONE_OFF:
                return <CategorizeInboxOneOffRow cluster={item.cluster} />;
            default:
                return <CategorizeInboxClusterCard cluster={item.cluster} />;
        }
    };

    const stickyHeaderIndices = items.flatMap((item, index) =>
        item.kind === CategorizeInboxListItemKindEnum.SECTION_HEADER ? [index] : []
    );

    return (
        <BudgieLegendList
            style={LEGEND_LIST_STYLE}
            data={items}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            estimatedItemSize={CATEGORIZE_INBOX_LIST_SIZING.estimatedItemSize}
            getItemType={CATEGORIZE_INBOX_LIST_SIZING.getItemType}
            stickyHeaderIndices={stickyHeaderIndices}
            drawDistance={600}
            extraData={expandedClusterKey}
            contentContainerStyle={CONTENT_CONTAINER_STYLE}
        />
    );
};
