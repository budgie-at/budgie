/* jscpd:ignore-start */
import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { accountService } from '../../service/account.service';
/* jscpd:ignore-end */

interface Props {
    readonly account: AccountEntityInterface;
}

const iconParams = { size: 46, iconSize: 20, variant: 'dark-warning' } as const;

export const ArchivedAccountCard = ({ account }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument, decimalPlaces } = useSettingsContext();
    const { balance } = useAccountBalanceQuery(account.id);
    const formatDigits = useFormatDigits(decimalPlaces);

    const handleRestoreAction = async () => {
        try {
            await accountService.restoreById(account.id);
        } catch {
            Toast.show({ type: 'error', text1: t`Could not restore account.`, text2: t`Something went wrong. Please try again later.` });
        }
    };

    const handleDeleteAction = async () => {
        try {
            await accountService.deleteById(account.id);
        } catch {
            Toast.show({ type: 'error', text1: t`Could not delete account.`, text2: t`Something went wrong. Please try again later.` });
        }
    };

    const restore = useConfirmAction(handleRestoreAction);
    const deleteAction = useConfirmAction(handleDeleteAction);

    const accountTitle = account.title;

    return (
        <>
            <SimpleHorizontalCell
                right={
                    <View className="flex-row items-center gap-x-xl">
                        <ProtectedText className="text-destructive-foreground text-sm font-semibold">
                            {formatDigits(balance, defaultInstrument.symbol)}
                        </ProtectedText>

                        <HapticPressable onPress={restore.handleOpen}>
                            <CircleIcon variant="positive" icon={UserIconNameEnum.RotateCcw} />
                        </HapticPressable>

                        <HapticPressable onPress={deleteAction.handleOpen}>
                            <CircleIcon variant="destructive" icon={UserIconNameEnum.Trash2} />
                        </HapticPressable>
                    </View>
                }
                icon={account.icon}
                title={account.title}
                description={t(ACCOUNT_TYPE[account.type])}
                iconParams={iconParams}
            />

            <ConfirmActionBottomSheet
                ref={restore.ref}
                icon={UserIconNameEnum.RotateCcw}
                variant="positive"
                buttonText={t`Restore`}
                onSubmit={restore.handleConfirm}
                title={t`Restore Account?`}
                description={t`${accountTitle} will be restored to your main view and included in totals.`}
                isLoading={restore.isLoading}
            />

            <ConfirmActionBottomSheet
                ref={deleteAction.ref}
                icon={UserIconNameEnum.OctagonAlert}
                variant="destructive"
                buttonText={t`Delete Permanently`}
                onSubmit={deleteAction.handleConfirm}
                title={t`Delete Account Permanently?`}
                description={t`${accountTitle} and its transactions will be permanently deleted. Transfers will be converted to income/expense on other accounts. This cannot be undone.`}
                isLoading={deleteAction.isLoading}
            />
        </>
    );
};
