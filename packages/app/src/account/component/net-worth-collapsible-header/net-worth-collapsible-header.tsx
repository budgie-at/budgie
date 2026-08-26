import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollapsibleHeader } from '@rnw-community/react-native-collapsible-header';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { HomePageSelector } from '../../../app/(tabs)/home-page.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { NetWorthAssetChips } from '../net-worth-asset-chips/net-worth-asset-chips';

import type { LayoutChangeEvent } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly scrollY: SharedValue<number>;
    readonly netWorth: number;
    readonly fiatTotal: number;
    readonly cryptoTotal: number;
    readonly fiatCount: number;
    readonly cryptoCount: number;
}

const HEADER_COLLAPSED_HEIGHT = 40;
const HEADER_EXPANDED_HEIGHT = 156;
const SCROLL_THRESHOLD = 100;
const EXPANDED_CONTENT_HORIZONTAL_PADDING = 40;

export const NetWorthCollapsibleHeader = ({ scrollY, netWorth, fiatTotal, cryptoTotal, fiatCount, cryptoCount }: Props) => {
    const { top } = useSafeAreaInsets();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();
    const [expandedHeaderWidth, setExpandedHeaderWidth] = useState(0);

    const handleExpandedHeaderLayout = (event: LayoutChangeEvent) => {
        setExpandedHeaderWidth(event.nativeEvent.layout.width);
    };

    const formattedNetWorth = formatDigits(netWorth, defaultInstrument.symbol);
    const formattedNetWorthValue = formatDigits(netWorth);
    const netWorthValueTestID = HomePageSelector.NetWorthValue(formattedNetWorthValue);
    const containerStyle = { paddingTop: top };
    const availableTickerWidth = Math.max(expandedHeaderWidth - EXPANDED_CONTENT_HORIZONTAL_PADDING, 0);

    const expandedContent = (
        <View className="flex-1 items-center justify-center px-5xl" onLayout={handleExpandedHeaderLayout}>
            <Text className="text-xs uppercase text-secondary-foreground mb-md">
                <Trans>Total Balance</Trans>
            </Text>

            <View collapsable={false} testID={netWorthValueTestID}>
                <ProtectedMoney
                    minFontSize={24}
                    maxFontSize={60}
                    instrumentSymbol={defaultInstrument.symbol}
                    availableWidth={availableTickerWidth}
                >
                    {netWorth}
                </ProtectedMoney>
            </View>

            <NetWorthAssetChips fiatTotal={fiatTotal} cryptoTotal={cryptoTotal} fiatCount={fiatCount} cryptoCount={cryptoCount} />
        </View>
    );

    const collapsedContent = (
        <View className="flex-1 flex-row items-center justify-between px-5xl">
            <Text className="text-xs uppercase text-secondary-foreground">
                <Trans>Total Balance</Trans>
            </Text>
            <ProtectedText
                className="text-lg font-medium text-primary"
                testID={HomePageSelector.NetWorthValueCollapsed(formattedNetWorthValue)}
            >
                {formattedNetWorth}
            </ProtectedText>
        </View>
    );

    return (
        <View style={containerStyle}>
            <CollapsibleHeader
                testID={HomePageSelector.TotalBalance}
                scrollY={scrollY}
                expandedHeight={HEADER_EXPANDED_HEIGHT}
                collapsedHeight={HEADER_COLLAPSED_HEIGHT}
                collapseDistance={SCROLL_THRESHOLD}
                expandedContent={expandedContent}
                collapsedContent={collapsedContent}
            />
        </View>
    );
};
