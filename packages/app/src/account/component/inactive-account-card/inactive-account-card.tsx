import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
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
    readonly account: AccountWithInstrumentEntityInterface;
}

export const InactiveAccountCard = ({ account }: Props) => {
    const { icon, title, type, id } = account;

    const { balance } = useAccountBalanceQuery(id);
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const ref = useRef<BottomSheetInterface | null>(null);
    const { i18n, t } = useLingui();

    const onActivate = () => ref.current?.open();

    const handleActivate = async () => {
        try {
            await accountService.activateById(account.id);
            ref.current?.close();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Could not activate account.`,
                text2: t`Something went wrong. Please try again later.`
            });
        }
    };

    const accountTitle = account.title;
    const description = t`${accountTitle} will be restored to your main view.`;

    const iconParams = { size: 46, iconSize: 20, variant: 'dark-warning' } as const;

    return (
        <>
            <SimpleHorizontalCell
                right={
                    <View className="flex-row items-center gap-x-xl">
                        <ProtectedText className="text-destructive-foreground text-sm font-semibold">
                            {formatDigits(balance, account.instrument.symbol)}
                        </ProtectedText>

                        <HapticPressable onPress={onActivate}>
                            <CircleIcon variant="positive" icon="Eye" />
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
                icon="Eye"
                variant="positive"
                buttonText={t`Activate`}
                onSubmit={handleActivate}
                title={t`Activate Account?`}
                description={description}
            />
        </>
    );
};
