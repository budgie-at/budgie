import { AccountAssociationEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { ReactNode, use } from 'react';
import { AccessibilityActionEvent, View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { ACCOUNT_SYNC_STATE_LABEL } from '../../constant/account-sync-state-label.constant';
import { ACCOUNT_TYPE_SWATCH } from '../../constant/account-type-swatch.constant';
import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { useAccountCardMenu } from '../../hook/use-account-card-menu.hook';
import { getAccountSyncState } from '../../utils/get-account-sync-state.util';
import { AccountCardBalance } from '../account-card-balance/account-card-balance';
import { AccountCardConvertedBalance } from '../account-card-converted-balance/account-card-converted-balance';
import { AccountCardMenu } from '../account-card-menu/account-card-menu';
import { AccountCardTitle } from '../account-card-title/account-card-title';
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
    readonly onImport?: EmptyFn;
    readonly children?: ReactNode;
}

const rowVariants = cva('min-h-[60px] gap-x-xl py-lg pr-xl pl-3xl active:scale-100 active:bg-surface-fill', {
    variants: { isStacked: { true: 'gap-y-sm', false: 'flex-row items-center' } }
});
const leadingVariants = cva('flex-row items-center gap-x-xl', {
    variants: { isStacked: { true: '', false: 'min-w-0 flex-1' } }
});
const amountVariants = cva('gap-y-xxs', {
    variants: { isStacked: { true: 'items-start', false: 'max-w-[55%] shrink-0 items-end' } }
});

export const AccountCardBase = ({ account, balance, convertedBalance, amountLabel, onImport, children }: Props) => {
    const { id, title, icon, iban, type, integrationId, sync, instrument } = account;

    const { t } = useLingui();
    const isStacked = useIsAccessibilityTextSize();
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
                className={rowVariants({ isStacked })}
            >
                <View className={leadingVariants({ isStacked })}>
                    {leading ?? (
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
                    )}

                    {isStacked ? null : (
                        <AccountCardTitle title={title} iban={iban} syncState={syncState} syncStateLabel={syncStateLabel} />
                    )}
                </View>

                {isStacked ? <AccountCardTitle title={title} iban={iban} syncState={syncState} syncStateLabel={syncStateLabel} /> : null}

                <View className={amountVariants({ isStacked })}>
                    {children ?? <AccountCardBalance title={title} balance={balance} instrumentSymbol={instrument.symbol} />}
                    <AccountCardConvertedBalance instrumentId={instrument.id} convertedBalance={convertedBalance} />
                </View>
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
