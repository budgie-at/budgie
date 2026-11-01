import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { BANK_PROVIDER_TITLE } from '../../../account/constant/bank-provider-title.constant';

import type { AccountEntityInterface, SyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'title'>;
    readonly instrumentCode: string;
    readonly sync: Pick<SyncEntityInterface, 'provider'> | null;
    readonly amountLabel: string;
    readonly valueLabel: string | null;
    readonly testID: string;
}

export const CurrencyMarketAccountRow = ({ account, instrumentCode, sync, amountLabel, valueLabel, testID }: Props) => {
    const { t } = useLingui();
    const providerTitle = isDefined(sync) ? BANK_PROVIDER_TITLE[sync.provider] : null;
    const subtitle = isDefined(providerTitle) ? t(providerTitle) : null;

    const handlePress = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(account.id) } });

    return (
        <GroupedListRow
            left={<CryptoCurrencyIcon code={instrumentCode} size={28} />}
            testID={testID}
            onPress={handlePress}
            title={
                <View className="min-h-[36px] flex-row flex-wrap items-center gap-x-xl gap-y-xxs">
                    <View className="min-w-[45%] flex-1 gap-y-xxs">
                        <Text className="text-primary text-[17px]" numberOfLines={2}>
                            {account.title}
                        </Text>
                        {isNotEmptyString(subtitle) ? (
                            <Text className="text-secondary-foreground text-[13px] leading-[18px]" numberOfLines={1}>
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                    <View className="ml-auto items-end">
                        <ProtectedText className="text-primary text-right text-[15px] tabular-nums">{amountLabel}</ProtectedText>
                        {isDefined(valueLabel) ? (
                            <ProtectedText className="text-secondary-foreground text-right text-[13px] tabular-nums">
                                {valueLabel}
                            </ProtectedText>
                        ) : null}
                    </View>
                </View>
            }
        />
    );
};
