import { AccountEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly balance: number;
    readonly className?: string;
    readonly instrumentCode: string;
    readonly instrumentSymbol: string;
}

export const CryptoAccountCard = (props: Props) => {
    const { id, title, icon, balance, className, instrumentCode, instrumentSymbol } = props;
    const formatDigits = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);

    const formattedBalance = `${formatDigits(balance)} ${instrumentCode}`;

    const balanceContent = (
        <View className="gap-y-1">
            <ProtectedText className="text-primary font-medium" testID={AccountCardBaseSelector.Balance(title, formattedBalance)}>
                {formattedBalance}
            </ProtectedText>
        </View>
    );

    return (
        <AccountCardBase
            id={id}
            title={title}
            icon={icon}
            balance={balance}
            className={className}
            instrumentSymbol={instrumentSymbol}
            balanceContent={balanceContent}
        />
    );
};
