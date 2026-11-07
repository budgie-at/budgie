import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { useIsFocused } from 'expo-router';
import { Text, View } from 'react-native';

import { CollapsibleHeaderBackdrop } from '@rnw-community/react-native-screen-chrome';

import { CollapsibleChromeHeader } from '../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { toTrueMinus } from '../../../@generic/utils/to-true-minus.util';
import { HomePageSelector } from '../../../app/(tabs)/home-page.selector';
import { SecurityLockButton } from '../../../auth/components/security-lock-button/security-lock-button';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { RunwayPill } from '../../../runway/component/runway-pill/runway-pill';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useSetting } from '../../../settings/hook/use-setting.hook';

interface Props {
    readonly netWorth: number;
    readonly isLoading: boolean;
}

export const NetWorthCollapsibleHeader = (props: Props) => {
    const { netWorth, isLoading } = props;
    const isFocused = useIsFocused();

    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const isRunwayPillEnabled = useSetting('isRunwayPillEnabled');
    const formatDigits = useDisplayFormatDigits();

    const formattedNetWorth = toTrueMinus(formatDigits(netWorth, defaultInstrument.symbol));
    const formattedNetWorthValue = formatDigits(netWorth);
    const loadingIndicatorProps = isFocused ? {} : { loadingIndicator: null };
    const expandedContent = (
        <View className="flex-1 justify-end gap-y-sm pt-sm pr-[12px] pb-lg pl-[16px]" pointerEvents="box-none">
            <View className="flex-row items-center justify-between">
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-[15px] font-medium text-secondary-foreground">
                    <Trans>Total Balance</Trans>
                </Text>

                <SecurityLockButton />
            </View>

            <LoadingContent isLoading={isLoading} className="gap-y-sm" {...loadingIndicatorProps}>
                <View collapsable={false} testID={HomePageSelector.NetWorthValue(formattedNetWorthValue)}>
                    <HeroFigure amount={netWorth} currencySymbol={defaultInstrument.symbol} variant="primary" />
                </View>

                {isRunwayPillEnabled ? (
                    <View className="flex-row">
                        <RunwayPill />
                    </View>
                ) : null}
            </LoadingContent>
        </View>
    );

    const collapsedContent = (
        <View className="self-stretch flex-row items-center justify-between gap-x-md pr-[12px] pl-[16px]" pointerEvents="box-none">
            <Text
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={1}
                className="shrink text-[15px] font-medium text-secondary-foreground"
            >
                <Trans>Total Balance</Trans>
            </Text>
            {isRunwayPillEnabled ? <RunwayPill /> : null}
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
        <>
            <CollapsibleHeaderBackdrop />
            <CollapsibleChromeHeader
                testID={HomePageSelector.TotalBalance}
                expandedTitle={expandedContent}
                expandedTitlePointerEvents="box-none"
                collapsedTitle={collapsedContent}
                collapsedTitlePointerEvents="box-none"
            />
        </>
    );
};
