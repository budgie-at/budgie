import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { getMarketChangeClassName } from '../../../market-data/utils/get-market-change-class-name.util';
import { getMarketChangeSign } from '../../../market-data/utils/get-market-change-sign.util';
import { useAccountDetailsMarketSummary } from '../../hook/use-account-details-market-summary.hook';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'code' | 'name'>;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const AccountDetailsMarketLink = ({ instrument }: Props) => {
    const { t } = useLingui();
    const { priceLabel, change, changeShare } = useAccountDetailsMarketSummary(instrument.id);

    const isUp = isDefined(change) && change >= 0;
    const marketName = instrument.name;
    const direction = isUp ? t`up ${changeShare} today` : t`down ${changeShare} today`;
    const accessibilityLabel = isDefined(changeShare)
        ? t`${marketName} market, ${priceLabel}, ${direction}`
        : t`${marketName} market, ${priceLabel}`;
    const changeToneClassName = getMarketChangeClassName(change ?? 0);
    const changeLabel = `${getMarketChangeSign(change ?? 0)}${changeShare}`;

    const handlePress = () => void router.push({ pathname: '/currency/[id]', params: { id: String(instrument.id) } });

    return (
        <HapticPressable
            accessible
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            className="min-h-[44px] flex-row items-center gap-x-md self-center rounded-full bg-surface-row px-xl active:opacity-70"
            style={CONTINUOUS_CORNERS}
            testID={AccountDetailsSelector.MarketLink}
            onPress={handlePress}
        >
            <CryptoCurrencyIcon code={instrument.code} size={20} />
            <Text className="text-[15px] font-medium text-primary" numberOfLines={1}>
                {instrument.name}
            </Text>
            <Text className="text-[15px] text-secondary-foreground tabular-nums" numberOfLines={1}>
                {priceLabel}
            </Text>
            {isDefined(changeShare) ? (
                <Text numberOfLines={1}>
                    <Text className={cn('text-[15px] font-semibold tabular-nums', changeToneClassName)}>{changeLabel}</Text>
                    <Text className="text-[13px] text-secondary-foreground">
                        {' '}
                        <Trans>24h</Trans>
                    </Text>
                </Text>
            ) : null}
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </HapticPressable>
    );
};
