import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { formatExchangeRate } from '../../../@generic/utils/format-exchange-rate.util';
import { useGetRatesByBaseAndQuoteIdsQuery } from '../../../exchange-rate/query/use-get-rates-by-base-and-quote-ids.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { useCryptoInstrumentTotalQuery } from '../../query/use-crypto-instrument-total.query';
import { CryptoCurrencyGroupAccounts } from '../crypto-currency-group-accounts/crypto-currency-group-accounts';

interface Props {
    readonly group: CryptoCurrencyGroupInterface;
}

export const CryptoCurrencyGroupCard = ({ group }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();
    const balance = useCryptoInstrumentTotalQuery(group.instrument.id);
    const { rate } = useGetRatesByBaseAndQuoteIdsQuery(group.instrument.id, defaultInstrument.id);

    const toggleOpen = () => void setIsOpen(value => !value);
    const { code: instrumentCode, name: instrumentName } = group.instrument;
    const formattedBalance = `${formatDigits(balance)} ${instrumentCode}`;
    const formattedValue = isDefined(rate) ? formatDigits(balance * rate.rate, defaultInstrument.symbol) : null;
    const formattedRate = isDefined(rate) ? formatExchangeRate(rate.rate) : null;
    const chevronIcon = isOpen ? UserIconNameEnum.ChevronDown : UserIconNameEnum.ChevronRight;
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
                <HapticPressable onPress={toggleOpen} className="gap-y-3">
                    <View className="flex-row items-start justify-between gap-x-md">
                        <View className="min-w-0 flex-1 flex-row items-center gap-x-md">
                            <CryptoCurrencyIcon code={instrumentCode} size={36} className="bg-warning-background/20" />

                            <View className="min-w-0 flex-1">
                                <Text className="text-primary text-sm font-medium" ellipsizeMode="tail" numberOfLines={1}>
                                    {instrumentName}
                                </Text>
                                <Text className="text-warning-foreground text-xs font-medium uppercase">{instrumentCode}</Text>
                            </View>
                        </View>

                        <View className="min-w-0 items-end gap-y-0.5">
                            <ProtectedText className="text-right text-primary text-lg font-semibold leading-6" placeholderText="***">
                                {formattedBalance}
                            </ProtectedText>

                            {isDefined(formattedValue) ? (
                                <ProtectedText className="text-right text-secondary-foreground text-xs font-medium" placeholderText="≈ ***">
                                    ≈ {formattedValue}
                                </ProtectedText>
                            ) : null}
                        </View>
                    </View>

                    <View className="flex-row items-end justify-between gap-x-md">
                        <View className="flex-row items-center gap-x-xs">
                            <Text className="text-secondary-foreground text-xs">{accountsCountLabel}</Text>
                            <Icon icon={chevronIcon} size={16} className="text-secondary-foreground" />
                        </View>

                        <Text className="shrink-0 text-right text-secondary-foreground text-xs">
                            {isDefined(formattedRate) ? (
                                <Trans>
                                    1 {instrumentCode} ≈ {defaultInstrumentSymbol}
                                    {formattedRate}
                                </Trans>
                            ) : (
                                <Trans>Missing rate</Trans>
                            )}
                        </Text>
                    </View>
                </HapticPressable>
            </Card>

            {isOpen ? <CryptoCurrencyGroupAccounts group={group} /> : null}
        </View>
    );
};
