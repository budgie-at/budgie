import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly title: string;
    readonly carriedAmount: number;
    readonly spent: number;
    readonly limit: number;
    readonly currencySymbol: string;
    readonly spentTestID: string;
}

export const BudgetLimitRow = ({ children, title, carriedAmount, spent, limit, currencySymbol, spentTestID }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const carriedLabel = formatDigits(convertFromMicroUnits(Math.abs(carriedAmount)), currencySymbol);
    const isSurplus = isPositiveNumber(carriedAmount);
    const pillLabel = isSurplus ? t`+${carriedLabel} rolled over` : t`−${carriedLabel} carried`;
    const pillVariant = isSurplus ? 'positive' : 'destructive';
    const pill = carriedAmount === 0 ? null : <MetaPill variant={pillVariant} label={pillLabel} />;
    const spentLabel = formatDigits(convertFromMicroUnits(spent), currencySymbol);
    const limitLabel = formatDigits(convertFromMicroUnits(limit), currencySymbol);

    return (
        <View className="gap-y-sm">
            <View className="flex-row items-center justify-between gap-x-md">
                <View className="shrink flex-row items-center gap-x-sm">
                    <Text numberOfLines={1} className="shrink text-sm font-medium text-primary">
                        {title}
                    </Text>
                    {pill}
                </View>

                <View className="flex-row items-baseline gap-x-xs">
                    <ProtectedText testID={spentTestID} className="text-sm font-semibold tabular-nums text-primary">
                        {spentLabel}
                    </ProtectedText>
                    <ProtectedText className="text-sm tabular-nums text-secondary-foreground">/ {limitLabel}</ProtectedText>
                </View>
            </View>

            {children}
        </View>
    );
};
