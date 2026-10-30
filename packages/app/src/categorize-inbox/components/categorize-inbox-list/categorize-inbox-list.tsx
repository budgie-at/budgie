import { CategorizeInboxSectionEnum } from '@budgie/categorization';

import { useBottomChromeInset } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { LEGEND_LIST_STYLE } from '../../../@generic/constant/legend-list.constant';
import { isCategorizeInboxCluster } from '../../type-guard/is-categorize-inbox-cluster.type-guard';
import { getCategorizeInboxRowPosition } from '../../utils/get-categorize-inbox-row-position.util';
import { CategorizeInboxGroupRow } from '../categorize-inbox-group-row/categorize-inbox-group-row';
import { CategorizeInboxHero } from '../categorize-inbox-hero/categorize-inbox-hero';
import { CategorizeInboxOneOffsLink } from '../categorize-inbox-one-offs-link/categorize-inbox-one-offs-link';
import { CategorizeInboxSectionHeader } from '../categorize-inbox-section-header/categorize-inbox-section-header';

import type { CategorizeInboxOneOffsLinkItemInterface } from '../../interface/categorize-inbox-one-offs-link-item.interface';
import type { CategorizeInboxListItemType } from '@budgie/categorization';
import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

interface Props {
    readonly items: CategorizeInboxListItemType[];
    readonly filterSection: CategorizeInboxSectionEnum | null;
    readonly onSectionPress: (section: CategorizeInboxSectionEnum | null) => void;
}

const LIST_BOTTOM_CLEARANCE = 24;
const INLINE_ONE_OFF_LIMIT = 5;

export const CategorizeInboxList = ({ items, filterSection, onSectionPress }: Props) => {
    const { chromeHeight } = useBottomChromeInset();

    const isInFilter = (section: CategorizeInboxSectionEnum): boolean => !isDefined(filterSection) || section === filterSection;
    const hiddenOneOffs = items
        .filter(isCategorizeInboxCluster)
        .filter(cluster => cluster.section === CategorizeInboxSectionEnum.ONE_OFFS)
        .slice(INLINE_ONE_OFF_LIMIT);
    const oneOffsLink: CategorizeInboxOneOffsLinkItemInterface[] =
        isNotEmptyArray(hiddenOneOffs) && isInFilter(CategorizeInboxSectionEnum.ONE_OFFS)
            ? [{ key: 'one-offs-link', oneOffs: hiddenOneOffs }]
            : [];
    const data = [
        ...items.filter(item => isInFilter(item.section) && !hiddenOneOffs.some(cluster => cluster.key === item.key)),
        ...oneOffsLink
    ];
    const isCardItem = (index: number): boolean => {
        const item = data.at(index);

        return index >= 0 && isDefined(item) && ('rows' in item || 'oneOffs' in item);
    };
    const positions = data.map((_item, index) => getCategorizeInboxRowPosition(isCardItem(index - 1), isCardItem(index + 1)));

    const keyExtractor = (item: (typeof data)[number]): string => item.key;
    const getItemType = (item: (typeof data)[number]): string => {
        if ('oneOffs' in item) {
            return 'one-offs-link';
        }

        return 'rows' in item ? 'group' : 'header';
    };

    const renderItem = ({ item, index }: LegendListRenderItemProps<(typeof data)[number]>) => {
        if ('oneOffs' in item) {
            return <CategorizeInboxOneOffsLink oneOffs={item.oneOffs} position={positions[index]} />;
        }

        if (!('rows' in item)) {
            return <CategorizeInboxSectionHeader section={item.section} rowCount={item.count} />;
        }

        return <CategorizeInboxGroupRow cluster={item} position={positions[index]} />;
    };

    const handleSectionPress = (section: CategorizeInboxSectionEnum): void =>
        void onSectionPress(section === filterSection ? null : section);

    const contentContainerStyle = { paddingBottom: chromeHeight + LIST_BOTTOM_CLEARANCE };

    return (
        <CollapsibleChromeLegendList
            style={LEGEND_LIST_STYLE}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            estimatedItemSize={72}
            extraData={positions}
            getItemType={getItemType}
            drawDistance={600}
            contentContainerStyle={contentContainerStyle}
            ListHeaderComponent={<CategorizeInboxHero activeSection={filterSection} onSectionPress={handleSectionPress} />}
        />
    );
};
