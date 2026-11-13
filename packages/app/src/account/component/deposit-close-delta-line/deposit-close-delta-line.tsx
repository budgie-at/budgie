import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { DepositCloseSelector } from '../../../app/deposit-close.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

interface Props {
    readonly delta: number;
    readonly instrumentSymbol: string;
}

export const DepositCloseDeltaLine = ({ delta, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const formattedDelta = formatDigits(Math.abs(delta), instrumentSymbol);
    const deltaLine = delta < 0 ? t`Shortfall: −${formattedDelta}` : t`Interest recorded: +${formattedDelta}`;

    return delta === 0 ? null : (
        <Text className="text-secondary-foreground text-sm" testID={DepositCloseSelector.DeltaLine}>
            {deltaLine}
        </Text>
    );
};
