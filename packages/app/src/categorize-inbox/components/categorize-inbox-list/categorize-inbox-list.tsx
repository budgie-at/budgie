import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomChromeInset } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { LEGEND_LIST_STYLE } from '../../../@generic/constant/legend-list.constant';
import { isCategorizeInboxCluster } from '../../type-guard/is-categorize-inbox-cluster.type-guard';
import { getCategorizeInboxCardGroup } from '../../utils/get-categorize-inbox-card-group.util';
import { getCategorizeInboxRowPosition } from '../../utils/get-categorize-inbox-row-position.util';
import { CategorizeInboxGroupRow } from '../categorize-inbox-group-row/categorize-inbox-group-row';
import { CategorizeInboxHero } from '../categorize-inbox-hero/categorize-inbox-hero';
import { CategorizeInboxOneOffsLink } from '../categorize-inbox-one-offs-link/categorize-inbox-one-offs-link';
import { CategorizeInboxPrefixHeader } from '../categorize-inbox-prefix-header/categorize-inbox-prefix-header';
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
    const { bottom } = useSafeAreaInsets();

    const isInFilter = (section: CategorizeInboxSectionEnum): boolean => !isDefined(filterSection) || section === filterSection;
    const hiddenOneOffs = items
        .filter(isCategorizeInboxCluster)
        .filter(cluster => cluster.section === CategorizeInboxSectionEnum.ONE_OFFS)
        .slice(INLINE_ONE_OFF_LIMIT);
    const data: (CategorizeInboxListItemType | CategorizeInboxOneOffsLinkItemInterface)[] = items.filter(
        item => isInFilter(item.section) && !hiddenOneOffs.some(cluster => cluster.key === item.key)
    );
    const firstOlderIndex = data.findIndex(item => 'section' in item && item.section === CategorizeInboxSectionEnum.OLDER);
    data.splice(
        firstOlderIndex < 0 ? data.length : firstOlderIndex,
        0,
        ...(isNotEmptyArray(hiddenOneOffs) && isInFilter(CategorizeInboxSectionEnum.ONE_OFFS)
            ? [{ key: 'one-offs-link', oneOffs: hiddenOneOffs }]
            : [])
    );
    const isSameCard = (index: number, otherIndex: number): boolean => {
        const group = index >= 0 ? getCategorizeInboxCardGroup(data.at(index)) : null;

        return isDefined(group) && group === getCategorizeInboxCardGroup(data.at(otherIndex));
    };
    const positions = data.map((_item, index) => getCategorizeInboxRowPosition(isSameCard(index - 1, index), isSameCard(index, index + 1)));

    const keyExtractor = (item: (typeof data)[number]): string => item.key;
    const getItemType = (item: (typeof data)[number]): string => {
        if ('oneOffs' in item) {
            return 'one-offs-link';
        }

        if ('prefix' in item) {
            return 'prefix-header';
        }

        return 'rows' in item ? 'group' : 'header';
    };

    const renderItem = ({ item, index }: LegendListRenderItemProps<(typeof data)[number]>) => {
        if ('oneOffs' in item) {
            return <CategorizeInboxOneOffsLink oneOffs={item.oneOffs} position={positions[index]} />;
        }

        if ('prefix' in item) {
            return <CategorizeInboxPrefixHeader prefix={item.prefix} rowCount={item.count} />;
        }

        if (!('rows' in item)) {
            return <CategorizeInboxSectionHeader section={item.section} rowCount={item.count} />;
        }

        return <CategorizeInboxGroupRow cluster={item} position={positions[index]} />;
    };

    const handleSectionPress = (section: CategorizeInboxSectionEnum): void =>
        void onSectionPress(section === filterSection ? null : section);

    const contentContainerStyle = { paddingBottom: Math.max(chromeHeight, bottom) + LIST_BOTTOM_CLEARANCE };

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
