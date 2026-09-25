import { BudgieLegendList } from '../../../@generic/component/budgie-legend-list/budgie-legend-list';
import { CategorizeInboxListItemKindEnum } from '../../enum/categorize-inbox-list-item-kind.enum';
import { CategorizeInboxClusterItem } from '../categorize-inbox-cluster-item/categorize-inbox-cluster-item';
import { CategorizeInboxSectionHeader } from '../categorize-inbox-section-header/categorize-inbox-section-header';

import type { CategorizeInboxListItemType } from '../../type/categorize-inbox-list-item.type';

interface Props {
    readonly items: CategorizeInboxListItemType[];
}

const ESTIMATED_ITEM_SIZE = 96;
const LIST_STYLE = { flex: 1 };
const CONTENT_CONTAINER_STYLE = { gap: 8, paddingBottom: 16 };

const keyExtractor = (item: CategorizeInboxListItemType) => item.key;

const renderItem = ({ item }: { item: CategorizeInboxListItemType }) =>
    item.kind === CategorizeInboxListItemKindEnum.SECTION_HEADER ? (
        <CategorizeInboxSectionHeader section={item.section} count={item.count} />
    ) : (
        <CategorizeInboxClusterItem cluster={item.cluster} />
    );

export const CategorizeInboxList = ({ items }: Props) => (
    <BudgieLegendList
        style={LIST_STYLE}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        contentContainerStyle={CONTENT_CONTAINER_STYLE}
    />
);
