import { AccountAssociationEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { OnEventFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { AccountSyncStateEnum } from '../../enum/account-sync-state.enum';
import { getAccountSyncState } from '../../utils/get-account-sync-state.util';
import { AccountCardBalance } from '../account-card-balance/account-card-balance';
import { AccountEditButton } from '../account-edit-button/account-edit-button';
import { AccountSyncBadge } from '../account-sync-badge/account-sync-badge';

import { AccountCardBaseSelector } from './account-card-base.selector';

interface Props {
    readonly account: Pick<
        AccountWithSyncEntityInterface,
        'id' | 'title' | 'icon' | 'iban' | AccountAssociationEnum.SYNC | AccountAssociationEnum.INSTRUMENT
    >;
    readonly balance: number;
    readonly onLongPress?: OnEventFn;
    readonly children?: ReactNode;
}

export const AccountCardBase = ({ account, balance, onLongPress, children }: Props) => {
    const { id, title, icon, iban, sync, instrument } = account;

    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();

    const navigateToAccount = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(id) } });

    const syncState = getAccountSyncState(sync);
    const syncStateLabels: Record<AccountSyncStateEnum, string> = {
        [AccountSyncStateEnum.SYNCED]: t`Up to date`,
        [AccountSyncStateEnum.SYNCING]: t`Syncing`,
        [AccountSyncStateEnum.FAILED]: t`Sync Failed`,
        [AccountSyncStateEnum.DISABLED]: t`Sync paused`
    };
    const syncStateLabel = isDefined(syncState) ? `, ${syncStateLabels[syncState]}` : '';
    const accessibilityLabel = `${title}, ${protectAmount(balance, instrument.symbol)}${syncStateLabel}`;
    const metaLabel = isNotEmptyString(iban) ? `${instrument.code} · ••${iban.slice(-4)}` : instrument.code;
    const syncBadge = isDefined(syncState) ? <AccountSyncBadge state={syncState} /> : null;

    return (
        <Card
            accessible
            size="md"
            testID={AccountCardBaseSelector.Card(title)}
            accessibilityLabel={accessibilityLabel}
            onPress={navigateToAccount}
            onLongPress={onLongPress}
            className="flex-1 gap-lg rounded-6xl active:scale-xs"
        >
            <View className="flex-row items-center justify-between">
                <View>
                    <CircleIcon size={30} iconSize={16} radius={10} icon={icon} variant="ghost" border={false} />
                    {syncBadge}
                </View>

                <AccountEditButton id={id} />
            </View>

            {children ?? <AccountCardBalance title={title} balance={balance} instrumentSymbol={instrument.symbol} />}

            <View className="mt-auto">
                <View className="min-h-[36px] justify-end">
                    <Text className="text-sm leading-[18px] text-primary" numberOfLines={2} ellipsizeMode="tail">
                        {title}
                    </Text>
                </View>

                <Text className="text-xs leading-[16px] tracking-wide text-secondary-foreground tabular-nums" numberOfLines={1}>
                    {metaLabel}
                </Text>
            </View>
        </Card>
    );
};
