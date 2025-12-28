import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { accountRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';

interface Props {
    readonly account: AccountEntityInterface;
}

export const ArchivedAccountCard = ({ account }: Props) => {
    const { icon, title, type, id } = account;

    const { balance } = useAccountBalanceQuery(id);
    const { decimalPlaces, defaultCurrency } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency);
    const ref = useRef<BottomSheetInterface | null>(null);
    const { i18n, t } = useLingui();

    const onRestore = () => ref.current?.open();

    const handleRestore = async () => {
        try {
            await accountRepository.restoreById(account.id);
            ref.current?.close();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Could not restore account.`,
                text2: t`Something went wrong. Please try again later.`
            });
        }
    };

    const accountTitle = account.title;
    const description = t`${accountTitle} will be restored to your main view and included in totals.`;

    const iconParams = { size: 46, iconSize: 20, variant: 'dark-warning' } as const;

    return (
        <>
            <SimpleHorizontalCell
                right={
                    <View className="flex-row items-center gap-x-xl">
                        <ProtectedText className="text-destructive-foreground text-sm font-semibold">{formatMoney(balance)}</ProtectedText>

                        <HapticPressable onPress={onRestore}>
                            <CircleIcon variant="positive" icon="RotateCcw" />
                        </HapticPressable>
                    </View>
                }
                icon={icon}
                title={title}
                description={i18n.t(ACCOUNT_TYPE[type])}
                iconParams={iconParams}
            />

            <ConfirmActionBottomSheet
                ref={ref}
                icon="RotateCcw"
                variant="positive"
                buttonText={t`Restore`}
                onSubmit={handleRestore}
                title={t`Restore Account?`}
                description={description}
            />
        </>
    );
};
