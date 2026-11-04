import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';

interface Props {
    readonly title: string;
    readonly balance: number;
    readonly instrumentSymbol: string;
    readonly testID?: string;
}

export const AccountCardBalance = ({ title, balance, instrumentSymbol, testID }: Props) => {
    const formatDigits = useDisplayFormatDigits();

    return (
        <MoneyText
            amount={balance}
            instrumentSymbol={instrumentSymbol}
            variant={MoneyTextVariantEnum.ROW}
            testID={testID ?? AccountCardBaseSelector.Balance(title, formatDigits(balance))}
        />
    );
};
