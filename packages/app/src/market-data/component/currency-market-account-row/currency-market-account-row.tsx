import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
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
            title={
                <Text className="text-primary text-[17px]" numberOfLines={1}>
                    {account.title}
                </Text>
            }
            subtitle={subtitle}
            testID={testID}
            onPress={handlePress}
            right={
                <View className="max-w-[64%] shrink-0 flex-row items-center gap-x-xs">
                    <View className="items-end">
                        <ProtectedText className="text-primary text-[15px] tabular-nums" numberOfLines={1}>
                            {amountLabel}
                        </ProtectedText>
                        {isDefined(valueLabel) ? (
                            <ProtectedText className="text-secondary-foreground text-[13px] tabular-nums" numberOfLines={1}>
                                {valueLabel}
                            </ProtectedText>
                        ) : null}
                    </View>
                    <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
                </View>
            }
        />
    );
};
