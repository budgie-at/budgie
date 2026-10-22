import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';

interface Props {
    readonly title: string;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const AccountCardBalance = ({ title, balance, instrumentSymbol }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();

    const formattedBalance = formatDigits(balance, instrumentSymbol);
    const fractionStart = isPositiveNumber(decimalPlaces) ? formattedBalance.length - decimalPlaces - 1 : formattedBalance.length;
    const isNegative = balance < 0;
    const toneClassName = isNegative ? 'text-destructive-foreground' : 'text-primary';
    const fractionToneClassName = isNegative ? 'text-destructive-foreground/70' : 'text-secondary-foreground';

    return (
        <ProtectedText
            testID={AccountCardBaseSelector.Balance(title, formatDigits(balance))}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            className={cn('text-xl leading-[26px] font-semibold tracking-tight tabular-nums', toneClassName)}
        >
            {formattedBalance.slice(0, fractionStart)}
            <Text className={cn('text-xs font-medium', fractionToneClassName)}>{formattedBalance.slice(fractionStart)}</Text>
        </ProtectedText>
    );
};
