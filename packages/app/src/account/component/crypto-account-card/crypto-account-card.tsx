import { AccountEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { AccountCardBase } from '../account-card-base/account-card-base';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly className?: string;
    readonly instrumentCode: string;
    readonly instrumentSymbol: string;
}

export const CryptoAccountCard = ({ id, title, icon, className, instrumentCode, instrumentSymbol }: Props) => {
    const { balance } = useAccountBalanceQuery(id);
    const formatDigits = useDisplayFormatDigits();

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
            className={className}
            instrumentSymbol={instrumentSymbol}
            balanceContent={balanceContent}
        />
    );
};
