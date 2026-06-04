import { AccountEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useAccountValuedBalanceQuery } from '../../query/use-account-valued-balance.query';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly className?: string;
    readonly instrumentSymbol: string;
}

export const CryptoAccountCard = ({ id, title, icon, className, instrumentSymbol }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();
    const { balance, valuedBalance } = useAccountValuedBalanceQuery(id);

    const formattedValuedBalance = formatDigits(valuedBalance, defaultInstrument.symbol);
    const formattedValuedBalanceTestValue = formatDigits(valuedBalance);
    const formattedNativeBalance = formatDigits(balance, instrumentSymbol);

    const balanceContent = (
        <View className="gap-0.5">
            <ProtectedText
                className="text-primary font-medium"
                testID={AccountCardBaseSelector.Balance(title, formattedValuedBalanceTestValue)}
            >
                {formattedValuedBalance}
            </ProtectedText>
            <ProtectedText className="text-secondary-foreground text-xs">{formattedNativeBalance}</ProtectedText>
        </View>
    );

    return (
        <AccountCardBase
            id={id}
            title={title}
            icon={icon}
            instrumentSymbol={instrumentSymbol}
            className={className}
            circleVariant="warning"
            balanceContent={balanceContent}
        />
    );
};
