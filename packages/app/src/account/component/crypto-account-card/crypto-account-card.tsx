import { AccountEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useCryptoFormatDigits } from '../../../i18n/hook/use-crypto-format-digits.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly balance: number;
    readonly className?: string;
    readonly instrumentCode: string;
    readonly instrumentSymbol: string;
}

export const CryptoAccountCard = (props: Props) => {
    const { id, title, icon, balance, className, instrumentCode, instrumentSymbol } = props;
    const formatDigits = useCryptoFormatDigits();

    const formattedBalance = `${formatDigits(balance)} ${instrumentCode}`;

    const balanceContent = (
        <View className="gap-y-1">
            <ProtectedText className="text-primary font-medium">{formattedBalance}</ProtectedText>
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
