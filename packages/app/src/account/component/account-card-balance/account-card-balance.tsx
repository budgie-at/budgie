import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';

interface Props {
    readonly title: string;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const AccountCardBalance = ({ title, balance, instrumentSymbol }: Props) => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatDigits = useFormatDigits(decimalPlaces);

    const formattedBalance = formatDigits(balance, instrumentSymbol).replace(/^-/u, '−');
    const fractionStart = isPositiveNumber(decimalPlaces) ? formattedBalance.length - decimalPlaces - 1 : formattedBalance.length;
    const toneClassName = balance < 0 ? 'text-destructive-foreground' : 'text-primary';

    return (
        <ProtectedText
            testID={AccountCardBaseSelector.Balance(title, formatDigits(balance))}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            className={cn('text-[17px] font-semibold tracking-tight tabular-nums', toneClassName)}
        >
            {formattedBalance.slice(0, fractionStart)}
            <Text className="text-[13px] font-medium text-secondary-foreground">{formattedBalance.slice(fractionStart)}</Text>
        </ProtectedText>
    );
};
