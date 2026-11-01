import { InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { PROTECTED_HERO_PLACEHOLDER } from '../../../@generic/constant/protected-hero-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { BANK_PROVIDER_TITLE } from '../../../account/constant/bank-provider-title.constant';
import { MILLION } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';

import type { AccountEntityInterface, SyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'title'>;
    readonly instrumentCode: string;
    readonly sync: Pick<SyncEntityInterface, 'provider'> | null;
    readonly amount: number;
    readonly valueLabel: string | null;
    readonly testID: string;
}

export const CurrencyMarketAccountRow = ({ account, instrumentCode, sync, amount, valueLabel, testID }: Props) => {
    const { t } = useLingui();
    const isAmountProtected = useIsAmountProtected();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const formatCompactDigits = useFormatCompactDigits(MILLION);

    const providerTitle = isDefined(sync) ? BANK_PROVIDER_TITLE[sync.provider] : null;
    const providerName = isDefined(providerTitle) ? t(providerTitle) : null;
    const subtitle = isDefined(providerName) ? t`${providerName} · No cost basis` : null;
    const fullAmountLabel = formatInstrumentAmount(amount, instrumentCode, InstrumentTypeEnum.CRYPTO);
    const amountLabel = Math.abs(amount) >= MILLION ? `${formatCompactDigits(amount)} ${instrumentCode}` : fullAmountLabel;
    const amountParts = isAmountProtected ? [] : [fullAmountLabel, valueLabel];
    const accessibilityLabel = [account.title, subtitle, ...amountParts].filter(isNotEmptyString).join(', ');
    const pressableProps = { accessibilityLabel };

    const handlePress = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(account.id) } });

    return (
        <GroupedListRow
            left={<CryptoCurrencyIcon code={instrumentCode} size={28} />}
            testID={testID}
            pressableProps={pressableProps}
            onPress={handlePress}
            title={
                <View className="my-px min-h-[34px] justify-center gap-y-xxs">
                    <Text className="text-primary text-[17px] leading-[22px]" numberOfLines={2}>
                        {account.title}
                    </Text>
                    {isNotEmptyString(subtitle) ? (
                        <Text className="text-secondary-foreground text-[13px] leading-[18px]" numberOfLines={1}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
            }
            right={
                <View className="flex-row items-center gap-x-xs">
                    <View className="w-[118px] shrink-0 grow-0 items-end justify-center">
                        <ProtectedText
                            className="text-primary text-right text-[15px] leading-[20px] tabular-nums"
                            numberOfLines={1}
                            placeholderText={PROTECTED_HERO_PLACEHOLDER}
                        >
                            {amountLabel}
                        </ProtectedText>
                        {isDefined(valueLabel) && !isAmountProtected ? (
                            <Text
                                className="text-secondary-foreground text-right text-[13px] leading-[18px] tabular-nums"
                                numberOfLines={1}
                            >
                                {valueLabel}
                            </Text>
                        ) : null}
                    </View>
                    <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
                </View>
            }
        />
    );
};
