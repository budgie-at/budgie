import { AccountAssociationEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { ReactNode, use } from 'react';
import { AccessibilityActionEvent, Text, View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ListRow } from '../../../@generic/component/list-row/list-row';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { ACCOUNT_SYNC_STATE_LABEL } from '../../constant/account-sync-state-label.constant';
import { ACCOUNT_TYPE_SWATCH } from '../../constant/account-type-swatch.constant';
import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { useAccountCardMenu } from '../../hook/use-account-card-menu.hook';
import { getAccountSyncState } from '../../utils/get-account-sync-state.util';
import { AccountCardBalance } from '../account-card-balance/account-card-balance';
import { AccountCardConvertedBalance } from '../account-card-converted-balance/account-card-converted-balance';
import { AccountCardDetail } from '../account-card-detail/account-card-detail';
import { AccountCardMenu } from '../account-card-menu/account-card-menu';
import { AccountSyncBadge } from '../account-sync-badge/account-sync-badge';

import { AccountCardBaseSelector } from './account-card-base.selector';

interface Props {
    readonly account: Pick<
        AccountWithSyncEntityInterface,
        'id' | 'title' | 'icon' | 'iban' | 'type' | 'integrationId' | AccountAssociationEnum.SYNC | AccountAssociationEnum.INSTRUMENT
    >;
    readonly balance: number;
    readonly convertedBalance: number | null;
    readonly amountLabel?: string;
    readonly subtitle?: string;
    readonly onImport?: EmptyFn;
    readonly children?: ReactNode;
}

export const AccountCardBase = ({ account, balance, convertedBalance, amountLabel, subtitle, onImport, children }: Props) => {
    const { id, title, icon, iban, type, integrationId, sync, instrument } = account;

    const { t } = useLingui();
    const leading = use(AccountRowLeadingContext);
    const protectAmount = useProtectedAmountLabel();
    const { cardRef, isMenuOpen, menuAnchor, openMenu, closeMenu, handleCloseComplete } = useAccountCardMenu();

    const navigateToAccount = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(id) } });
    const navigateToEdit = () => void router.push({ pathname: '/account/[id]/update', params: { id: String(id) } });

    const syncState = getAccountSyncState(sync);
    const syncStateLabel = isDefined(syncState) ? t(ACCOUNT_SYNC_STATE_LABEL[syncState]) : null;
    const accessibilityLabel = [title, amountLabel ?? protectAmount(balance, instrument.symbol), syncStateLabel]
        .filter(isDefined)
        .join(', ');
    const accessibilityActions = [
        ...(isDefined(onImport) ? [{ name: 'import', label: t`Import file`, onAction: onImport }] : []),
        { name: 'edit', label: t`Edit account`, onAction: navigateToEdit }
    ];
    const handleAccessibilityAction = (event: AccessibilityActionEvent) =>
        accessibilityActions.find(action => action.name === event.nativeEvent.actionName)?.onAction();
    const swatch = ACCOUNT_TYPE_SWATCH[type];

    return (
        <View ref={cardRef} collapsable={false}>
            <HapticPressable
                accessible
                accessibilityRole="button"
                testID={AccountCardBaseSelector.Card(title)}
                accessibilityLabel={accessibilityLabel}
                accessibilityActions={accessibilityActions}
                onAccessibilityAction={handleAccessibilityAction}
                onPress={navigateToAccount}
                onLongPress={openMenu}
                className="min-h-[60px] px-3xl py-lg active:scale-100 active:bg-surface-fill"
            >
                <ListRow
                    leading={
                        leading ?? (
                            <View>
                                <CircleIcon
                                    size={36}
                                    iconSize={18}
                                    radius={9}
                                    icon={icon}
                                    variant="ghost"
                                    border={false}
                                    className={swatch.soft}
                                    iconClassName={swatch.text}
                                />
                                {isDefined(syncState) ? <AccountSyncBadge state={syncState} /> : null}
                            </View>
                        )
                    }
                    title={
                        <Text
                            className="text-[17px] font-semibold text-primary"
                            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                            numberOfLines={2}
                        >
                            {title}
                        </Text>
                    }
                    trailing={
                        <View className="max-w-[55%] shrink-0 items-end gap-y-xxs">
                            {children ?? <AccountCardBalance title={title} balance={balance} instrumentSymbol={instrument.symbol} />}
                            <AccountCardConvertedBalance instrumentId={instrument.id} convertedBalance={convertedBalance} />
                        </View>
                    }
                    detail={<AccountCardDetail subtitle={subtitle} iban={iban} syncState={syncState} syncStateLabel={syncStateLabel} />}
                />
            </HapticPressable>

            <AccountCardMenu
                integrationId={integrationId}
                anchor={menuAnchor}
                isOpen={isMenuOpen}
                onClose={closeMenu}
                onCloseComplete={handleCloseComplete}
                onEdit={navigateToEdit}
                {...(isDefined(onImport) && { onImport })}
            />
        </View>
    );
};
