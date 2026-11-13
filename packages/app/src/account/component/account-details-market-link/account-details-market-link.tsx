import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { parseISO } from 'date-fns/parseISO';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { getMarketChangeSign } from '../../../market-data/utils/get-market-change-sign.util';
import { getMarketMoveClassName } from '../../../market-data/utils/get-market-move-class-name.util';
import { isMarketPriceStale } from '../../../market-data/utils/is-market-price-stale.util';
import { useAccountDetailsMarketSummary } from '../../hook/use-account-details-market-summary.hook';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'code' | 'name' | 'symbol' | 'type' | 'quoteInstrumentId'>;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const containerVariants = cva('min-h-[44px] max-w-full flex-row items-center gap-x-md self-center bg-surface-row px-xl active:opacity-70', {
    variants: { stacked: { true: 'rounded-2xl', false: 'rounded-full' } }
});
const contentVariants = cva('min-w-0 shrink gap-x-md gap-y-xs py-md', {
    variants: { stacked: { true: 'items-start', false: 'flex-row items-center' } }
});

export const AccountDetailsMarketLink = ({ instrument }: Props) => {
    const { t } = useLingui();
    const { priceLabel, change, changeShare, priceDate } = useAccountDetailsMarketSummary(
        instrument.id,
        isListedSecurityType(instrument.type) ? instrument.quoteInstrumentId : null
    );
    const { formatMonthAndDay } = useFormatDate();

    const isStacked = useIsAccessibilityTextSize();

    const isUp = isDefined(change) && change >= 0;
    const marketName = isListedSecurityType(instrument.type) ? instrument.symbol : instrument.name;
    const staleDate = isDefined(priceDate) && isMarketPriceStale(priceDate) ? formatMonthAndDay(parseISO(priceDate)) : null;
    const dailyDirection = isUp ? t`up ${changeShare} over the last 24 hours` : t`down ${changeShare} over the last 24 hours`;
    const staleDirection = isUp ? t`up ${changeShare} on ${staleDate}` : t`down ${changeShare} on ${staleDate}`;
    const direction = isDefined(staleDate) ? staleDirection : dailyDirection;
    const accessibilityLabel = isDefined(changeShare)
        ? t`${marketName} market, ${priceLabel}, ${direction}`
        : t`${marketName} market, ${priceLabel}`;
    const changeToneClassName = getMarketMoveClassName(change ?? 0);
    const changeLabel = `${getMarketChangeSign(change ?? 0)}${changeShare}`;

    const handlePress = () => void router.push({ pathname: '/currency/[id]', params: { id: String(instrument.id) } });

    return (
        <HapticPressable
            accessible
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            className={containerVariants({ stacked: isStacked })}
            style={CONTINUOUS_CORNERS}
            testID={AccountDetailsSelector.MarketLink}
            onPress={handlePress}
        >
            {isStacked ? null : (
                <CurrencySelectorInstrumentIcon code={instrument.code} symbol={instrument.symbol} type={instrument.type} size={20} />
            )}
            <View className={contentVariants({ stacked: isStacked })}>
                <Text
                    className="shrink-0 text-[15px] font-medium text-primary"
                    numberOfLines={1}
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {marketName}
                </Text>
                <Text
                    className="min-w-0 shrink text-[15px] text-secondary-foreground tabular-nums"
                    numberOfLines={1}
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {priceLabel}
                </Text>
                {isDefined(changeShare) ? (
                    <Text numberOfLines={1} maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}>
                        <Text className={cn('text-[15px] font-semibold tabular-nums', changeToneClassName)}>{changeLabel}</Text>
                        <Text className="text-[13px] text-secondary-foreground">
                            {' '}
                            {isDefined(staleDate) ? staleDate : <Trans>24h</Trans>}
                        </Text>
                    </Text>
                ) : null}
            </View>
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </HapticPressable>
    );
};
