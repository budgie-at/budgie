import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { accountRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { RestoreAccountBottomSheet } from '../restore-account-bottom-sheet/restore-account-bottom-sheet';

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

    return (
        <>
            <Card className="flex-row items-center gap-x-xl">
                <CircleIcon size="1_5xl" icon={ICONS[icon]} variant="dark-warning" />

                <View className="mr-auto">
                    <Text className="text-sm font-semibold text-primary">{title}</Text>
                    <Text className="text-xs text-secondary-foreground">{i18n.t(ACCOUNT_TYPE[type])}</Text>
                </View>

                <Text className="text-destructive-foreground text-sm font-semibold">{formatMoney(balance)}</Text>

                <HapticPressable onPress={onRestore}>
                    <CircleIcon variant="positive" icon={ICONS.RotateCcw} />
                </HapticPressable>
            </Card>

            <RestoreAccountBottomSheet ref={ref} title={account.title} onRestore={handleRestore} />
        </>
    );
};
