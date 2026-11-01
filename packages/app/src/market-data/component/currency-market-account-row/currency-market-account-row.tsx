import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { BANK_PROVIDER_TITLE } from '../../../account/constant/bank-provider-title.constant';

import type { AccountEntityInterface, SyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'icon' | 'title'>;
    readonly sync: Pick<SyncEntityInterface, 'provider'> | null;
    readonly amountLabel: string;
    readonly valueLabel: string | null;
    readonly testID: string;
}

export const CurrencyMarketAccountRow = ({ account, sync, amountLabel, valueLabel, testID }: Props) => {
    const { t } = useLingui();
    const providerTitle = isDefined(sync) ? BANK_PROVIDER_TITLE[sync.provider] : null;
    const subtitle = isDefined(providerTitle) ? t(providerTitle) : null;

    const handlePress = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(account.id) } });

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={account.icon} />}
            title={
                <Text className="text-primary text-[17px]" numberOfLines={1}>
                    {account.title}
                </Text>
            }
            subtitle={subtitle}
            testID={testID}
            onPress={handlePress}
            right={
                <View className="max-w-[48%] flex-row items-center gap-x-xs">
                    <View className="shrink items-end">
                        <ProtectedText
                            className="text-primary text-[17px] tabular-nums"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                        >
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
