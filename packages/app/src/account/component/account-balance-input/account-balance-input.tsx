import { AmountInput } from '../../../@generic/components/amount-input/amount-input';
import { useFormatDigits } from '../../../@generic/hooks/use-format-digits.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly value: number;
    readonly textClassName?: string;
    readonly onChange: (value: number) => void;
}

export const AccountBalanceInput = ({ value, onChange, textClassName }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const { format } = useFormatDigits(decimalPlaces);

    return (
        <AmountInput
            value={value}
            onChangeValue={onChange}
            inputClassName={cn('text-[72px] text-primary placeholder-secondary-reverse-foreground', textClassName)}
            placeholder={format('0.00')}
        />
    )
};
