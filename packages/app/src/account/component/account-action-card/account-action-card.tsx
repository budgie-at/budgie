/* jscpd:ignore-start */
import { AccountEntityInterface, AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Alert, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
/* jscpd:ignore-end */

interface Props {
    readonly account: AccountEntityInterface | AccountWithInstrumentEntityInterface;
    readonly actionIcon: UserIconNameEnum;
    readonly actionButtonText: string;
    readonly confirmTitle: string;
    readonly confirmDescription: string;
    readonly errorText: string;
    readonly currencySymbol: string;
    readonly onAction: () => Promise<void>;
    readonly testID?: string;
    readonly actionButtonTestID?: string;
}

export const AccountActionCard = (props: Props) => {
    const {
        account,
        actionIcon,
        actionButtonText,
        confirmTitle,
        confirmDescription,
        errorText,
        currencySymbol,
        onAction,
        testID,
        actionButtonTestID
    } = props;
    const { icon, title, type } = account;

    const { balance } = useAccountBalanceQuery(account.id);
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { t } = useLingui();

    const handleAction = () => {
        Alert.alert(confirmTitle, confirmDescription, [
            { text: t`Cancel`, style: 'cancel' },
            {
                text: actionButtonText,
                onPress: () =>
                    void onAction().catch(() => {
                        Toast.show({
                            type: 'error',
                            text1: errorText,
                            text2: t`Something went wrong. Please try again later.`
                        });
                    })
            }
        ]);
    };

    return (
        <SimpleHorizontalCell
            testID={testID}
            right={
                <View className="flex-row items-center gap-x-xl">
                    <ProtectedText className="text-destructive-foreground text-sm font-semibold">
                        {formatDigits(balance, currencySymbol)}
                    </ProtectedText>

                    <HapticPressable testID={actionButtonTestID} onPress={handleAction}>
                        <CircleIcon variant="positive" icon={actionIcon} />
                    </HapticPressable>
                </View>
            }
            left={<CircleIcon icon={icon} variant="dark-warning" size={46} iconSize={20} />}
            title={title}
            description={t(ACCOUNT_TYPE[type])}
        />
    );
};
