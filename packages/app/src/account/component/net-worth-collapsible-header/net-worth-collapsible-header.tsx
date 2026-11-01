import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { StyleSheet, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { CollapsibleHeader } from '@rnw-community/react-native-collapsible-header';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { HomePageSelector } from '../../../app/(tabs)/home-page.selector';
import { SecurityLockButton } from '../../../auth/components/security-lock-button/security-lock-button';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { RunwayPill } from '../../../runway/component/runway-pill/runway-pill';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { NetWorthAssetChips } from '../net-worth-asset-chips/net-worth-asset-chips';

interface Props {
    readonly netWorth: number;
    readonly fiatTotal: number;
    readonly cryptoTotal: number;
    readonly fiatCount: number;
    readonly cryptoCount: number;
    readonly isLoading: boolean;
}

const HEADER_COLLAPSED_HEIGHT = 44;
const HEADER_EXPANDED_HEIGHT = 172;
const SCROLL_THRESHOLD = 112;

export const NetWorthCollapsibleHeader = (props: Props) => {
    const { netWorth, fiatTotal, cryptoTotal, fiatCount, cryptoCount, isLoading } = props;

    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const isRunwayPillEnabled = useSetting('isRunwayPillEnabled');
    const formatDigits = useDisplayFormatDigits();
    const [surfaceColor, separatorColor] = useCSSVariable(['--color-grouped-surface', '--color-surface-separator']);

    const formattedNetWorth = formatDigits(netWorth, defaultInstrument.symbol).replace(/^-/u, '−');
    const formattedNetWorthValue = formatDigits(netWorth);
    const backgroundStyle = {
        backgroundColor: String(surfaceColor),
        borderBottomColor: String(separatorColor),
        borderBottomWidth: StyleSheet.hairlineWidth
    };

    const expandedContent = (
        <View className="flex-1 justify-end gap-y-sm pt-sm pr-[28px] pb-lg pl-[32px]">
            <View className="flex-row items-center justify-between">
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-[15px] font-medium text-secondary-foreground">
                    <Trans>Total Balance</Trans>
                </Text>

                <SecurityLockButton />
            </View>

            <LoadingContent isLoading={isLoading} className="gap-y-sm">
                <View collapsable={false} testID={HomePageSelector.NetWorthValue(formattedNetWorthValue)}>
                    <HeroFigure amount={netWorth} currencySymbol={defaultInstrument.symbol} variant="primary" />
                </View>

                <View className="flex-row flex-wrap items-center gap-sm">
                    <NetWorthAssetChips fiatTotal={fiatTotal} cryptoTotal={cryptoTotal} fiatCount={fiatCount} cryptoCount={cryptoCount} />

                    {isRunwayPillEnabled ? <RunwayPill /> : null}
                </View>
            </LoadingContent>
        </View>
    );

    const collapsedContent = (
        <View className="flex-1 flex-row items-center justify-between gap-x-md pr-[28px] pl-[32px]">
            <Text
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={1}
                className="shrink text-[15px] font-medium text-secondary-foreground"
            >
                <Trans>Total Balance</Trans>
            </Text>
            <ProtectedText
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={1}
                className="text-[17px] font-semibold tracking-tight tabular-nums text-primary"
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
                backgroundStyle={backgroundStyle}
                expandedContent={expandedContent}
                collapsedContent={collapsedContent}
            />
        </View>
    );
};
