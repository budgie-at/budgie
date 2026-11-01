import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { useBottomChromeInset, useScreenChrome, useScreenChromeScrollProps } from '@rnw-community/react-native-screen-chrome';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { isCategorizeInboxCluster } from '../../type-guard/is-categorize-inbox-cluster.type-guard';
import { getCategorizeInboxRowPosition } from '../../utils/get-categorize-inbox-row-position.util';
import { CategorizeInboxGroupRow } from '../categorize-inbox-group-row/categorize-inbox-group-row';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

const LIST_BOTTOM_CLEARANCE = 32;
const ESTIMATED_ROW_HEIGHT = 72;

const keyExtractor = (cluster: CategorizeInboxClusterInterface): string => cluster.key;

export const CategorizeInboxOneOffsList = () => {
    const { t } = useLingui();
    const { items } = useCategorizeInboxContext();
    const { config } = useScreenChrome();
    const { chromeHeight } = useBottomChromeInset();
    const horizontalInset = useResolveClassNames('px-5xl');

    const clusters = items.filter(isCategorizeInboxCluster).filter(cluster => cluster.section === CategorizeInboxSectionEnum.ONE_OFFS);
    const groupCount = clusters.length;
    const paymentCount = clusters.reduce((sum, cluster) => sum + cluster.rows.length, 0);
    const scrollProps = useScreenChromeScrollProps({
        contentInsetTop: config.headerHeight,
        contentInsetBottom: chromeHeight + LIST_BOTTOM_CLEARANCE,
        contentContainerStyle: horizontalInset
    });

    const renderItem = ({ item, index }: LegendListRenderItemProps<CategorizeInboxClusterInterface>) => {
        const position = getCategorizeInboxRowPosition(index > 0, index < groupCount - 1);

        return <CategorizeInboxGroupRow cluster={item} position={position} />;
    };

    const groupsText = t({ message: plural(groupCount, { one: '# group', other: '# groups' }) });
    const paymentsText = t({ message: plural(paymentCount, { one: '# payment', other: '# payments' }) });
    const header = (
        <Text className="text-secondary-foreground pb-3xl text-center text-[15px] leading-[20px] tabular-nums">{`${groupsText} · ${paymentsText}`}</Text>
    );

    return (
        <AnimatedLegendList
            {...scrollProps}
            data={clusters}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            estimatedItemSize={ESTIMATED_ROW_HEIGHT}
            extraData={groupCount}
            ListHeaderComponent={header}
            showsVerticalScrollIndicator={false}
            recycleItems
        />
    );
};
