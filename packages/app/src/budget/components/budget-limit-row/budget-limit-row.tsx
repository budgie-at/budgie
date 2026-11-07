import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly title: string;
    readonly carriedAmount: number;
    readonly spent: number;
    readonly limit: number;
    readonly currencySymbol: string;
    readonly spentTestID: string;
    readonly trailing?: ReactNode;
}

export const BudgetLimitRow = (props: Props) => {
    const { children, title, carriedAmount, spent, limit, currencySymbol, spentTestID, trailing } = props;
    const { t } = useLingui();
    const isStacked = useIsLargeTextSize();
    const formatDigits = useFormatDigits(0);
    const carriedLabel = formatDigits(convertFromMicroUnits(Math.abs(carriedAmount)), currencySymbol);
    const isSurplus = isPositiveNumber(carriedAmount);
    const pillLabel = isSurplus ? t`+${carriedLabel} rolled over` : t`−${carriedLabel} carried`;
    const pillVariant = isSurplus ? 'positive' : 'destructive';
    const pill =
        carriedAmount === 0 ? null : (
            <MetaPill variant={pillVariant} label={pillLabel} maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER} />
        );
    const spentLabel = formatDigits(convertFromMicroUnits(spent), currencySymbol);
    const limitLabel = formatDigits(convertFromMicroUnits(limit), currencySymbol);
    const headerClassName = isStacked ? 'gap-y-xs' : 'flex-row items-center justify-between gap-x-md';
    const titleRowClassName = isStacked ? 'flex-row flex-wrap items-center gap-x-sm gap-y-xxs' : 'shrink flex-row items-center gap-x-sm';

    return (
        <View className="gap-y-sm">
            <View className={headerClassName}>
                <View className={titleRowClassName}>
                    <Text numberOfLines={2} maxFontSizeMultiplier={2} className="shrink text-sm font-medium text-primary">
                        {title}
                    </Text>
                    {pill}
                </View>

                <View className="min-w-0 flex-row items-center justify-between gap-x-xs">
                    <View className="min-w-0 shrink flex-row flex-wrap items-center gap-x-xs gap-y-xxs">
                        <ProtectedText
                            testID={spentTestID}
                            className="shrink text-sm font-semibold tabular-nums text-primary"
                            adjustsFontSizeToFit
                            minimumFontScale={0.6}
                        >
                            {spentLabel}
                        </ProtectedText>
                        <ProtectedText
                            className="shrink text-sm tabular-nums text-secondary-foreground"
                            adjustsFontSizeToFit
                            minimumFontScale={0.6}
                        >
                            / {limitLabel}
                        </ProtectedText>
                    </View>
                    {trailing}
                </View>
            </View>

            {children}
        </View>
    );
};
