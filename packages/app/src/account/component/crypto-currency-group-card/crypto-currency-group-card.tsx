import { useAtomValue } from '@effect/atom-react/Hooks';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { useCryptoValuationRateQuery } from '../../../exchange-rate/query/use-crypto-valuation-rate.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
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
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const formatCryptoDigits = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);
    const valuationRate = useCryptoValuationRateQuery(group.instrument.id, defaultInstrument.id);
    const isFractionalRate = isDefined(valuationRate) && valuationRate > 0 && valuationRate < 1;
    const rateFractionDigits = isFractionalRate ? Math.min(Math.max(Math.ceil(-Math.log10(valuationRate)) + 2, 4), 8) : 2;
    const formatRate = useFormatDigits(2, rateFractionDigits);

    const toggleOpen = () => void setIsOpen(value => !value);
    const navigateToMarket = () => void router.push({ pathname: '/currency/[id]', params: { id: String(group.instrument.id) } });
    const formattedBalance = `${formatCryptoDigits(balance)} ${group.instrument.code}`;
    const formattedValue = isDefined(valuationRate) ? formatDigits(balance * valuationRate, defaultInstrument.symbol) : null;
    const rateLabel = isDefined(valuationRate) ? formatRate(valuationRate) : null;

    return (
        <View testID={CryptoCurrencyGroupCardSelector.Card(group.instrument.code)}>
            <CryptoCurrencyGroupMarketLink
                instrumentCode={group.instrument.code}
                instrumentName={group.instrument.name}
                formattedBalance={formattedBalance}
                formattedValue={formattedValue}
                formattedRate={rateLabel}
                defaultInstrumentSymbol={defaultInstrument.symbol}
                onPress={navigateToMarket}
            />

            <CryptoCurrencyGroupToggleRow
                accountsCount={group.accounts.length}
                instrumentCode={group.instrument.code}
                isOpen={isOpen}
                onPress={toggleOpen}
                testID={CryptoCurrencyGroupCardSelector.Toggle(group.instrument.code)}
            />

            {isOpen ? <CryptoCurrencyGroupAccounts group={group} balancesByAccountId={balancesByAccountId} /> : null}
        </View>
    );
};
