import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { testID } from '../../../@generic/utils/test-id.util';
import { ACCOUNT_TYPE } from '../../../account/constant/account-type.constant';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { CategorizeInboxTransferScreenSelector } from '../categorize-inbox-transfer-screen/categorize-inbox-transfer-screen.selector';

import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
    readonly onSelect: (account: AccountWithInstrumentEntityInterface) => void;
}

export const CategorizeInboxTransferAccountRow = ({ account, onSelect }: Props) => {
    const { t } = useLingui();
    const { balance } = useAccountBalanceQuery(account.id);
    const formatDigits = useDisplayFormatDigits();

    const handlePress = (): void => void onSelect(account);

    return (
        <HapticPressable
            onPress={handlePress}
            className="border-t-hairline border-secondary-corner gap-y-xxs py-[13px]"
            accessibilityRole="button"
            accessibilityLabel={account.title}
            {...testID(CategorizeInboxTransferScreenSelector.Account, account.id)}
        >
            <View className="flex-row items-center justify-between gap-x-xl">
                <Text className="text-primary text-md flex-1 font-semibold" numberOfLines={1}>
                    {account.title}
                </Text>
                <ProtectedText className="text-primary text-sm font-medium tabular-nums" numberOfLines={1}>
                    {formatDigits(balance, account.instrument.symbol)}
                </ProtectedText>
            </View>
            <Text className="text-secondary-foreground text-xs" numberOfLines={1}>
                {t(ACCOUNT_TYPE[account.type])}
            </Text>
        </HapticPressable>
    );
};
