import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { formatExchangeRate } from '../../../@generic/utils/format-exchange-rate.util';
import { useGetRatesByBaseAndQuoteIdsQuery } from '../../../exchange-rate/query/use-get-rates-by-base-and-quote-ids.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useInstrumentMarketDataQuery } from '../../../market-data/query/use-instrument-market-data.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { CryptoCurrencyGroupAccounts } from '../crypto-currency-group-accounts/crypto-currency-group-accounts';
import { CryptoCurrencyGroupMarketLink } from '../crypto-currency-group-market-link/crypto-currency-group-market-link';
import { CryptoCurrencyGroupToggleRow } from '../crypto-currency-group-toggle-row/crypto-currency-group-toggle-row';

import { CryptoCurrencyGroupCardSelector } from './crypto-currency-group-card.selector';

interface Props {
    readonly group: CryptoCurrencyGroupInterface;
    readonly balance: number;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const CryptoCurrencyGroupCard = ({ group, balance, balancesByAccountId }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();
    const formatCryptoDigits = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);
    const { rate } = useGetRatesByBaseAndQuoteIdsQuery(group.instrument.id, defaultInstrument.id);
    const { latestPrice } = useInstrumentMarketDataQuery(group.instrument.id, defaultInstrument.id);

    const toggleOpen = () => void setIsOpen(value => !value);
    const navigateToMarket = () => void router.push({ pathname: '/currency/[id]', params: { id: String(group.instrument.id) } });
    const valuationRate = rate?.rate ?? latestPrice?.price;
    const formattedBalance = `${formatCryptoDigits(balance)} ${group.instrument.code}`;
    const formattedValue = isDefined(valuationRate) ? formatDigits(balance * valuationRate, defaultInstrument.symbol) : null;
    const formattedRate = isDefined(valuationRate) ? formatExchangeRate(valuationRate) : null;

    return (
        <View className="mb-3 gap-y-3">
            <Card
                className="border-warning-corner bg-secondary-background"
                size="md"
                testID={CryptoCurrencyGroupCardSelector.Card(group.instrument.code)}
            >
                <View className="gap-y-3">
                    <CryptoCurrencyGroupMarketLink
                        instrumentCode={group.instrument.code}
                        instrumentName={group.instrument.name}
                        formattedBalance={formattedBalance}
                        formattedValue={formattedValue}
                        onPress={navigateToMarket}
                    />

                    <CryptoCurrencyGroupToggleRow
                        accountsCount={group.accounts.length}
                        defaultInstrumentSymbol={defaultInstrument.symbol}
                        formattedRate={formattedRate}
                        instrumentCode={group.instrument.code}
                        isOpen={isOpen}
                        onPress={toggleOpen}
                        testID={CryptoCurrencyGroupCardSelector.Toggle(group.instrument.code)}
                    />
                </View>
            </Card>

            {isOpen ? <CryptoCurrencyGroupAccounts group={group} balancesByAccountId={balancesByAccountId} /> : null}
        </View>
    );
};
