import { AccountEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useGetRatesByBaseAndQuoteIdsQuery } from '../../../exchange-rate/query/use-get-rates-by-base-and-quote-ids.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { AccountCardBase } from '../account-card-base/account-card-base';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly className?: string;
    readonly instrumentId: number;
    readonly instrumentCode: string;
    readonly instrumentSymbol: string;
}

export const CryptoAccountCard = ({ id, title, icon, className, instrumentId, instrumentCode, instrumentSymbol }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { balance } = useAccountBalanceQuery(id);
    const { rate } = useGetRatesByBaseAndQuoteIdsQuery(instrumentId, defaultInstrument.id);
    const formatDigits = useDisplayFormatDigits();

    const formattedBalance = `${formatDigits(balance)} ${instrumentCode}`;
    const formattedValue = isDefined(rate) ? formatDigits(balance * rate.rate, defaultInstrument.symbol) : null;
    const formattedRate = isDefined(rate) ? formatDigits(rate.rate, defaultInstrument.symbol) : null;

    const balanceContent = (
        <View className="gap-y-1">
            <ProtectedText className="text-primary font-medium">{formattedBalance}</ProtectedText>

            {isDefined(formattedValue) && (
                <ProtectedText className="text-secondary-foreground text-xs" placeholderText="≈ ***">
                    ≈ {formattedValue}
                </ProtectedText>
            )}

            {isDefined(formattedRate) && (
                <Text className="text-secondary-foreground/60 text-xs">
                    1 {instrumentCode} ≈ {formattedRate}
                </Text>
            )}
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
