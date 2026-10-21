import { Text } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';

interface Props {
    readonly title: string;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const AccountCardBalance = ({ title, balance, instrumentSymbol }: Props) => {
    const { decimalSeparator } = useLocaleInfo();
    const formatDigits = useDisplayFormatDigits();

    const formattedBalance = formatDigits(balance, instrumentSymbol);
    const separatorIndex = formattedBalance.lastIndexOf(decimalSeparator);
    const fractionStart = separatorIndex === -1 ? formattedBalance.length : separatorIndex;
    const toneClassName = balance < 0 ? 'text-destructive-foreground' : 'text-primary';

    return (
        <ProtectedText
            testID={AccountCardBaseSelector.Balance(title, formatDigits(balance))}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            className={cn('text-2xl font-semibold tracking-tight tabular-nums', toneClassName)}
        >
            {formattedBalance.slice(0, fractionStart)}
            <Text className="text-sm font-medium text-secondary-foreground">{formattedBalance.slice(fractionStart)}</Text>
        </ProtectedText>
    );
};
