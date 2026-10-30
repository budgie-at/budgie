import { convertFromMicroUnits } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionInfoSimilarBar } from '../transaction-info-similar-bar/transaction-info-similar-bar';

import type { SimilarTransactionMonthRowInterface } from '@budgie/contracts';

const BAR_MAX_HEIGHT = 88;

interface Props {
    readonly month: SimilarTransactionMonthRowInterface;
    readonly maxAmount: number;
    readonly currencySymbol: string;
    readonly currentMonthKey: string | null;
    readonly formatCompactDigits: (value: number, symbol?: string) => string;
    readonly formatDigits: (value: number, symbol?: string) => string;
    readonly testID: string;
}

export const TransactionInfoSimilarMonthBar = (props: Props) => {
    const { month, maxAmount, currencySymbol, currentMonthKey, formatCompactDigits, formatDigits, testID } = props;
    const { formatShortMonth } = useFormatDate();
    const isAmountProtected = useIsAmountProtected();
    const [yearText = '0', monthText = '1'] = month.monthKey.split('-');
    const monthLabelDate = new Date(Number(yearText), Number(monthText) - 1, 1);
    const hasAmount = isPositiveNumber(month.totalAmount);
    const height = hasAmount ? Math.max(8, Math.round((month.totalAmount / maxAmount) * BAR_MAX_HEIGHT)) : 2;
    const label = `${formatShortMonth(monthLabelDate)}${monthText === '01' ? `\n${yearText}` : ''}`;
    const amount = convertFromMicroUnits(month.totalAmount);
    const value = hasAmount ? formatCompactDigits(amount, currencySymbol) : '';
    const protectedValue = isAmountProtected && hasAmount ? PROTECTED_AMOUNT_PLACEHOLDER : value;
    const accessibilityValue = hasAmount ? formatDigits(amount, currencySymbol) : '0';
    const barClassName = month.monthKey === currentMonthKey ? 'bg-default-foreground' : 'bg-secondary-foreground/60';

    return (
        <TransactionInfoSimilarBar
            height={height}
            label={label}
            value={protectedValue}
            accessibilityValue={accessibilityValue}
            barClassName={barClassName}
            testID={testID}
        />
    );
};
