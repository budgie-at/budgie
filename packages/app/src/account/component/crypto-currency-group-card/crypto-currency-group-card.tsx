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
import { CryptoCurrencySparkline } from '../crypto-currency-sparkline/crypto-currency-sparkline';

interface Props {
    readonly group: CryptoCurrencyGroupInterface;
}

export const CryptoCurrencyGroupCard = ({ group }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();
    const balance = useCryptoInstrumentTotalQuery(group.instrumentId);
    const { rate } = useGetRatesByBaseAndQuoteIdsQuery(group.instrumentId, defaultInstrument.id);

    const toggleOpen = () => void setIsOpen(value => !value);
    const formattedBalance = `${formatDigits(balance)} ${group.instrumentCode}`;
    const formattedValue = isDefined(rate) ? formatDigits(balance * rate.rate, defaultInstrument.symbol) : null;
    const formattedRate = isDefined(rate) ? formatExchangeRate(rate.rate) : null;
    const chevronIcon = isOpen ? UserIconNameEnum.ChevronDown : UserIconNameEnum.ChevronRight;
    const { instrumentCode } = group;
    const defaultInstrumentSymbol = defaultInstrument.symbol;
    const accountsCountLabel = t({
        message: plural(group.accounts.length, {
            one: '# account',
            other: '# accounts'
        })
    });

    return (
        <View className="mb-3 gap-y-3">
            <Card className="relative overflow-hidden border-warning-corner bg-secondary-background" size="lg">
                <CryptoCurrencySparkline />

                <HapticPressable onPress={toggleOpen} className="gap-y-4">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-x-lg">
                            <CryptoCurrencyIcon code={group.instrumentCode} size={42} className="bg-warning-background/20" />

                            <View>
                                <Text className="text-primary text-base font-medium">{group.instrumentName}</Text>
                                <Text className="text-warning-foreground text-xs font-medium uppercase">{group.instrumentCode}</Text>
                            </View>
                        </View>

                        <Icon icon={chevronIcon} size={18} className="text-secondary-foreground" />
                    </View>

                    <View className="gap-y-1">
                        <ProtectedText className="text-primary text-3xl font-medium">{formattedBalance}</ProtectedText>

                        {isDefined(formattedValue) ? (
                            <ProtectedText className="text-secondary-foreground text-sm" placeholderText="≈ ***">
                                ≈ {formattedValue}
                            </ProtectedText>
                        ) : (
                            <Text className="text-secondary-foreground text-sm">
                                <Trans>Rate unavailable</Trans>
                            </Text>
                        )}
                    </View>

                    <View className="flex-row items-center justify-between gap-x-md">
                        <View className="flex-row items-center gap-x-xs rounded-full bg-background/70 border border-secondary-corner px-md py-xs">
                            <Icon icon={UserIconNameEnum.Activity} size={13} className="text-warning-foreground" />
                            <Text className="text-primary text-xs font-medium">
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

                        <Text className="text-secondary-foreground text-xs">{accountsCountLabel}</Text>
                    </View>
                </HapticPressable>
            </Card>

            {isOpen ? <CryptoCurrencyGroupAccounts group={group} /> : null}
        </View>
    );
};
