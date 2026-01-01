import { AccountEntityInterface, AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { IconName } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';

interface Props {
    readonly account: AccountEntityInterface | AccountWithInstrumentEntityInterface;
    readonly actionIcon: IconName;
    readonly actionButtonText: string;
    readonly confirmTitle: string;
    readonly confirmDescription: string;
    readonly errorText: string;
    readonly currencySymbol: string;
    readonly onAction: () => Promise<void>;
}

const iconParams = { size: 46, iconSize: 20, variant: 'dark-warning' } as const;

export const AccountActionCard = (props: Props) => {
    const { account, actionIcon, actionButtonText, confirmTitle, confirmDescription, errorText, currencySymbol, onAction } = props;
    const { icon, title, type } = account;

    const { balance } = useAccountBalanceQuery(account.id);
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const ref = useRef<BottomSheetInterface | null>(null);
    const { i18n, t } = useLingui();

    const handlePress = () => ref.current?.open();

    const handleAction = async () => {
        try {
            await onAction();
            ref.current?.close();
        } catch {
            Toast.show({
                type: 'error',
                text1: errorText,
                text2: t`Something went wrong. Please try again later.`
            });
        }
    };

    return (
        <>
            <SimpleHorizontalCell
                right={
                    <View className="flex-row items-center gap-x-xl">
                        <ProtectedText className="text-destructive-foreground text-sm font-semibold">
                            {formatDigits(balance, currencySymbol)}
                        </ProtectedText>

                        <HapticPressable onPress={handlePress}>
                            <CircleIcon variant="positive" icon={actionIcon} />
                        </HapticPressable>
                    </View>
                }
                icon={icon as UserIconNameEnum}
                title={title}
                description={i18n.t(ACCOUNT_TYPE[type])}
                iconParams={iconParams}
            />

            <ConfirmActionBottomSheet
                ref={ref}
                icon={actionIcon}
                variant="positive"
                buttonText={actionButtonText}
                onSubmit={handleAction}
                title={confirmTitle}
                description={confirmDescription}
            />
        </>
    );
};
