import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudgieLegendList } from '../../../@generic/component/budgie-legend-list/budgie-legend-list';
import { LEGEND_LIST_CONTENT_GAP, LEGEND_LIST_STYLE } from '../../../@generic/constant/legend-list.constant';
import { CategorizeInboxListItemKindEnum } from '../../enum/categorize-inbox-list-item-kind.enum';
import { CategorizeInboxSectionEnum } from '../../enum/categorize-inbox-section.enum';
import { CategorizeInboxClusterCard } from '../categorize-inbox-cluster-card/categorize-inbox-cluster-card';
import { CategorizeInboxOneOffRow } from '../categorize-inbox-one-off-row/categorize-inbox-one-off-row';
import { CategorizeInboxSectionHeader } from '../categorize-inbox-section-header/categorize-inbox-section-header';
import { CategorizeInboxTransferCard } from '../categorize-inbox-transfer-card/categorize-inbox-transfer-card';

import type { CategorizeInboxListItemType } from '../../type/categorize-inbox-list-item.type';
import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

interface Props {
    readonly items: CategorizeInboxListItemType[];
}

const ESTIMATED_ITEM_SIZE = 112;
const DOCK_CLEARANCE = 160;

export const CategorizeInboxList = ({ items }: Props) => {
    const { bottom } = useSafeAreaInsets();

    const keyExtractor = (item: CategorizeInboxListItemType): string => item.key;

    const getItemType = (item: CategorizeInboxListItemType): string =>
        item.kind === CategorizeInboxListItemKindEnum.SECTION_HEADER ? item.kind : item.cluster.section;

    const renderItem = ({ item }: LegendListRenderItemProps<CategorizeInboxListItemType>) => {
        if (item.kind === CategorizeInboxListItemKindEnum.SECTION_HEADER) {
            return <CategorizeInboxSectionHeader section={item.section} rowCount={item.count} />;
        }

        if (item.cluster.section === CategorizeInboxSectionEnum.TRANSFERS) {
            return <CategorizeInboxTransferCard cluster={item.cluster} />;
        }

        if (item.cluster.section === CategorizeInboxSectionEnum.ONE_OFFS) {
            return <CategorizeInboxOneOffRow cluster={item.cluster} />;
        }

        return <CategorizeInboxClusterCard cluster={item.cluster} />;
    };

    const contentContainerStyle = { gap: LEGEND_LIST_CONTENT_GAP, paddingBottom: bottom + DOCK_CLEARANCE };

    return (
        <BudgieLegendList
            style={LEGEND_LIST_STYLE}
            data={items}
            keyExtractor={keyExtractor}
            getItemType={getItemType}
            renderItem={renderItem}
            estimatedItemSize={ESTIMATED_ITEM_SIZE}
            contentContainerStyle={contentContainerStyle}
        />
    );
};
