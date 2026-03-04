/* jscpd:ignore-start */
import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Alert, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { ArchivedAccountCardSelectors } from '../../../@e2e/selectors/archived-account-card.selector';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useArchivedAccountBalanceQuery } from '../../query/use-archived-account-balance.query';
import { accountService } from '../../service/account.service';
/* jscpd:ignore-end */

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
}

export const ArchivedAccountCard = ({ account }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const { balance } = useArchivedAccountBalanceQuery(account.id);
    const formatDigits = useFormatDigits(decimalPlaces);

    const accountTitle = account.title;

    const handleRestore = () => {
        Alert.alert(t`Restore Account?`, t`${accountTitle} will be restored to your main view and included in totals.`, [
            { text: t`Cancel`, style: 'cancel' },
            {
                text: t`Restore`,
                onPress: () =>
                    void accountService.restoreById(account.id).catch(() => {
                        Toast.show({
                            type: 'error',
                            text1: t`Could not restore account.`,
                            text2: t`Something went wrong. Please try again later.`
                        });
                    })
            }
        ]);
    };

    const handleDelete = () => {
        Alert.alert(
            t`Delete Account Permanently?`,
            t`${accountTitle} and its transactions will be permanently deleted. Transfers will be converted to income/expense on other accounts. This cannot be undone.`,
            [
                { text: t`Cancel`, style: 'cancel' },
                {
                    text: t`Delete Permanently`,
                    style: 'destructive',
                    onPress: () =>
                        void accountService.deleteById(account.id).catch(() => {
                            Toast.show({
                                type: 'error',
                                text1: t`Could not delete account.`,
                                text2: t`Something went wrong. Please try again later.`
                            });
                        })
                }
            ]
        );
    };

    return (
        <SimpleHorizontalCell
            right={
                <View className="flex-row items-center gap-x-xl">
                    <ProtectedText className="text-destructive-foreground text-sm font-semibold">
                        {formatDigits(balance, account.instrument.symbol)}
                    </ProtectedText>

                    <HapticPressable testID={ArchivedAccountCardSelectors.RestoreButton} onPress={handleRestore}>
                        <CircleIcon variant="positive" icon={UserIconNameEnum.RotateCcw} />
                    </HapticPressable>

                    <HapticPressable testID={ArchivedAccountCardSelectors.DeleteButton} onPress={handleDelete}>
                        <CircleIcon variant="destructive" icon={UserIconNameEnum.Trash2} />
                    </HapticPressable>
                </View>
            }
            left={<CircleIcon icon={account.icon} variant="dark-warning" size={46} iconSize={20} />}
            title={account.title}
            description={t(ACCOUNT_TYPE[account.type])}
        />
    );
};
