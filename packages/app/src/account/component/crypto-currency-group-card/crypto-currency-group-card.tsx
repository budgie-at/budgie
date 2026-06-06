import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { formatExchangeRate } from '../../../@generic/utils/format-exchange-rate.util';
import { useGetRatesByBaseAndQuoteIdsQuery } from '../../../exchange-rate/query/use-get-rates-by-base-and-quote-ids.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
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
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();
    const { rate } = useGetRatesByBaseAndQuoteIdsQuery(group.instrument.id, defaultInstrument.id);

    const toggleOpen = () => void setIsOpen(value => !value);
    const navigateToMarket = () => void router.push(`/currency/${group.instrument.id}`);
    const { code: instrumentCode, name: instrumentName } = group.instrument;
    const formattedBalance = `${formatDigits(balance)} ${instrumentCode}`;
    const formattedValue = isDefined(rate) ? formatDigits(balance * rate.rate, defaultInstrument.symbol) : null;
    const formattedRate = isDefined(rate) ? formatExchangeRate(rate.rate) : null;
    const defaultInstrumentSymbol = defaultInstrument.symbol;
    const accountsCountLabel = t({
        message: plural(group.accounts.length, {
            one: '# account',
            other: '# accounts'
        })
    });

    return (
        <View className="mb-3 gap-y-3">
            <Card className="border-warning-corner bg-secondary-background" size="md">
                <View className="gap-y-3">
                    <CryptoCurrencyGroupMarketLink
                        instrumentCode={instrumentCode}
                        instrumentName={instrumentName}
                        formattedBalance={formattedBalance}
                        formattedValue={formattedValue}
                        onPress={navigateToMarket}
                    />

                    <CryptoCurrencyGroupToggleRow
                        onPress={toggleOpen}
                        accountsCountLabel={accountsCountLabel}
                        defaultInstrumentSymbol={defaultInstrumentSymbol}
                        formattedRate={formattedRate}
                        instrumentCode={instrumentCode}
                        isOpen={isOpen}
                        testID={CryptoCurrencyGroupCardSelector.Toggle(instrumentCode)}
                    />
                </View>
            </Card>

            {isOpen ? <CryptoCurrencyGroupAccounts group={group} balancesByAccountId={balancesByAccountId} /> : null}
        </View>
    );
};
