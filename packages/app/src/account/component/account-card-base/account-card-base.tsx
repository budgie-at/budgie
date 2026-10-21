import { AccountAssociationEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { AccessibilityActionEvent, View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { AccountSyncStateEnum } from '../../enum/account-sync-state.enum';
import { useAccountCardMenu } from '../../hook/use-account-card-menu.hook';
import { getAccountSyncState } from '../../utils/get-account-sync-state.util';
import { AccountCardBalance } from '../account-card-balance/account-card-balance';
import { AccountCardMenu } from '../account-card-menu/account-card-menu';
import { AccountCardTitle } from '../account-card-title/account-card-title';
import { AccountSyncBadge } from '../account-sync-badge/account-sync-badge';

import { AccountCardBaseSelector } from './account-card-base.selector';

interface Props {
    readonly account: Pick<
        AccountWithSyncEntityInterface,
        'id' | 'title' | 'icon' | 'iban' | 'integrationId' | AccountAssociationEnum.SYNC | AccountAssociationEnum.INSTRUMENT
    >;
    readonly balance: number;
    readonly amountLabel?: string;
    readonly onImport?: EmptyFn;
    readonly children?: ReactNode;
}

export const AccountCardBase = ({ account, balance, amountLabel, onImport, children }: Props) => {
    const { id, title, icon, iban, integrationId, sync, instrument } = account;

    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const { cardRef, isMenuOpen, menuAnchor, openMenu, closeMenu } = useAccountCardMenu();

    const navigateToAccount = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(id) } });
    const navigateToEdit = () => void router.push({ pathname: '/account/[id]/update', params: { id: String(id) } });

    const syncState = getAccountSyncState(sync);
    const syncStateLabels: Record<AccountSyncStateEnum, string> = {
        [AccountSyncStateEnum.SYNCED]: t`Up to date`,
        [AccountSyncStateEnum.SYNCING]: t`Syncing`,
        [AccountSyncStateEnum.WAITING]: t`Waiting`,
        [AccountSyncStateEnum.FAILED]: t`Sync Failed`,
        [AccountSyncStateEnum.DISABLED]: t`Sync paused`
    };
    const syncStateLabel = isDefined(syncState) ? syncStateLabels[syncState] : null;
    const accessibilityLabel = [title, amountLabel ?? protectAmount(balance, instrument.symbol), syncStateLabel]
        .filter(isDefined)
        .join(', ');
    const accessibilityActions = [
        ...(isDefined(onImport) ? [{ name: 'import', label: t`Import file`, onAction: onImport }] : []),
        { name: 'edit', label: t`Edit account`, onAction: navigateToEdit }
    ];
    const handleAccessibilityAction = (event: AccessibilityActionEvent) =>
        accessibilityActions.find(action => action.name === event.nativeEvent.actionName)?.onAction();

    return (
        <View ref={cardRef} collapsable={false} className="flex-1">
            <HapticPressable
                accessible
                accessibilityRole="button"
                testID={AccountCardBaseSelector.Card(title)}
                accessibilityLabel={accessibilityLabel}
                accessibilityActions={accessibilityActions}
                onAccessibilityAction={handleAccessibilityAction}
                onPress={navigateToAccount}
                onLongPress={openMenu}
                className="flex-1 gap-xs rounded-5xl border border-secondary-corner bg-primary-reverse p-xl active:scale-xs"
            >
                <View className="flex-row items-start gap-sm">
                    <View className="min-w-0 flex-1">
                        {children ?? <AccountCardBalance title={title} balance={balance} instrumentSymbol={instrument.symbol} />}
                    </View>

                    <View>
                        <CircleIcon size={24} iconSize={14} radius={8} icon={icon} variant="ghost" border={false} />
                        {isDefined(syncState) ? <AccountSyncBadge state={syncState} /> : null}
                    </View>
                </View>

                <AccountCardTitle title={title} iban={iban} syncState={syncState} syncStateLabel={syncStateLabel} />
            </HapticPressable>

            <AccountCardMenu
                integrationId={integrationId}
                anchor={menuAnchor}
                isOpen={isMenuOpen}
                onClose={closeMenu}
                onEdit={navigateToEdit}
                {...(isDefined(onImport) && { onImport })}
            />
        </View>
    );
};
