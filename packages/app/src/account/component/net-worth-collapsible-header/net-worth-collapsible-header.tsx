import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { CollapsibleHeader } from '@rnw-community/react-native-collapsible-header';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { HomePageSelector } from '../../../app/(tabs)/home-page.selector';
import { SecurityLockButton } from '../../../auth/components/security-lock-button/security-lock-button';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { RunwayPill } from '../../../runway/component/runway-pill/runway-pill';
import { decimalPlacesAtom, defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { NetWorthAssetChips } from '../net-worth-asset-chips/net-worth-asset-chips';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly netWorth: number;
    readonly fiatTotal: number;
    readonly cryptoTotal: number;
    readonly fiatCount: number;
    readonly cryptoCount: number;
}

const HEADER_COLLAPSED_HEIGHT = 40;
const HEADER_EXPANDED_HEIGHT = 156;
const SCROLL_THRESHOLD = 100;
const EXPANDED_CONTENT_HORIZONTAL_PADDING = 32;
const LOCK_BUTTON_RESERVED_WIDTH = 68;

export const NetWorthCollapsibleHeader = ({ netWorth, fiatTotal, cryptoTotal, fiatCount, cryptoCount }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const isRunwayPillEnabled = useSetting('isRunwayPillEnabled');
    const formatDigits = useFormatDigits(useAtomValue(decimalPlacesAtom));
    const [expandedHeaderWidth, setExpandedHeaderWidth] = useState(0);

    const handleExpandedHeaderLayout = (event: LayoutChangeEvent) => {
        setExpandedHeaderWidth(event.nativeEvent.layout.width);
    };

    const formattedNetWorth = formatDigits(netWorth, defaultInstrument.symbol);
    const formattedNetWorthValue = formatDigits(netWorth);
    const netWorthValueTestID = HomePageSelector.NetWorthValue(formattedNetWorthValue);
    const availableTickerWidth = Math.max(expandedHeaderWidth - EXPANDED_CONTENT_HORIZONTAL_PADDING - LOCK_BUTTON_RESERVED_WIDTH, 0);

    const expandedContent = (
        <View className="flex-1 items-center justify-center px-3xl" onLayout={handleExpandedHeaderLayout}>
            <Text className="text-xs uppercase text-secondary-foreground mb-md">
                <Trans>Total Balance</Trans>
            </Text>

            <View collapsable={false} testID={netWorthValueTestID}>
                <ProtectedMoney
                    minFontSize={24}
                    maxFontSize={60}
                    instrumentSymbol={defaultInstrument.symbol}
                    availableWidth={availableTickerWidth}
                    accessory={<SecurityLockButton />}
                >
                    {netWorth}
                </ProtectedMoney>
            </View>

            <View className="mt-lg flex-row flex-wrap items-center justify-center gap-sm">
                <NetWorthAssetChips fiatTotal={fiatTotal} cryptoTotal={cryptoTotal} fiatCount={fiatCount} cryptoCount={cryptoCount} />

                {isRunwayPillEnabled ? <RunwayPill /> : null}
            </View>
        </View>
    );

    const collapsedContent = (
        <View className="flex-1 flex-row items-center justify-between px-3xl">
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
        <View className="pt-safe">
            <CollapsibleHeader
                testID={HomePageSelector.TotalBalance}
                expandedHeight={HEADER_EXPANDED_HEIGHT}
                collapsedHeight={HEADER_COLLAPSED_HEIGHT}
                collapseDistance={SCROLL_THRESHOLD}
                expandedContent={expandedContent}
                collapsedContent={collapsedContent}
            />
        </View>
    );
};
