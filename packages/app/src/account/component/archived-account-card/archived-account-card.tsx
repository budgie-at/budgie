import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { accountService } from '../../service/account.service';

interface Props {
    readonly account: AccountEntityInterface;
}

const iconParams = { size: 46, iconSize: 20, variant: 'dark-warning' } as const;

export const ArchivedAccountCard = ({ account }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument, decimalPlaces } = useSettingsContext();
    const { balance } = useAccountBalanceQuery(account.id);
    const formatDigits = useFormatDigits(decimalPlaces);

    const restoreRef = useRef<BottomSheetInterface | null>(null);
    const deleteRef = useRef<BottomSheetInterface | null>(null);

    const [isRestoring, setIsRestoring] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleOpenRestore = () => restoreRef.current?.open();
    const handleOpenDelete = () => deleteRef.current?.open();

    const showErrorToast = (message: string) => {
        Toast.show({ type: 'error', text1: message, text2: t`Something went wrong. Please try again later.` });
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            await accountService.restoreById(account.id);
            restoreRef.current?.close();
        } catch {
            showErrorToast(t`Could not restore account.`);
        } finally {
            setIsRestoring(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await accountService.deleteById(account.id);
            deleteRef.current?.close();
        } catch {
            showErrorToast(t`Could not delete account.`);
        } finally {
            setIsDeleting(false);
        }
    };
    const accountTitle = account.title;

    return (
        <>
            <SimpleHorizontalCell
                right={
                    <View className="flex-row items-center gap-x-xl">
                        <ProtectedText className="text-destructive-foreground text-sm font-semibold">
                            {formatDigits(balance, defaultInstrument.symbol)}
                        </ProtectedText>

                        <HapticPressable onPress={handleOpenRestore}>
                            <CircleIcon variant="positive" icon={UserIconNameEnum.RotateCcw} />
                        </HapticPressable>

                        <HapticPressable onPress={handleOpenDelete}>
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
                ref={restoreRef}
                icon={UserIconNameEnum.RotateCcw}
                variant="positive"
                buttonText={t`Restore`}
                onSubmit={handleRestore}
                title={t`Restore Account?`}
                description={t`${accountTitle} will be restored to your main view and included in totals.`}
                isLoading={isRestoring}
            />

            <ConfirmActionBottomSheet
                ref={deleteRef}
                icon={UserIconNameEnum.OctagonAlert}
                variant="destructive"
                buttonText={t`Delete Permanently`}
                onSubmit={handleDelete}
                title={t`Delete Account Permanently?`}
                description={t`${accountTitle} and its transactions will be permanently deleted. Transfers will be converted to income/expense on other accounts. This cannot be undone.`}
                isLoading={isDeleting}
            />
        </>
    );
};
