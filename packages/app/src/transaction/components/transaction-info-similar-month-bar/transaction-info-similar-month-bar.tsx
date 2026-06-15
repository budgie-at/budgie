import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { TransactionInfoSimilarBar } from '../transaction-info-similar-bar/transaction-info-similar-bar';

import type { SimilarTransactionMonthRowInterface } from '@budgie/contracts';

const BAR_MAX_HEIGHT = 92;

interface Props {
    readonly month: SimilarTransactionMonthRowInterface;
    readonly maxAmount: number;
    readonly currencySymbol: string;
    readonly formatDigits: (value: number, symbol?: string) => string;
    readonly testID: string;
}

export const TransactionInfoSimilarMonthBar = ({ month, maxAmount, currencySymbol, formatDigits, testID }: Props) => {
    const [yearText = '0', monthText = '1'] = month.monthKey.split('-');
    const monthLabelDate = new Date(Number(yearText), Number(monthText) - 1, 1);
    const height = isPositiveNumber(month.totalAmount) ? Math.max(8, Math.round((month.totalAmount / maxAmount) * BAR_MAX_HEIGHT)) : 0;
    const label = format(monthLabelDate, 'MMM yy', { locale: enUS });
    const value = isPositiveNumber(month.totalAmount) ? formatDigits(convertFromMicroUnits(month.totalAmount), currencySymbol) : null;

    return <TransactionInfoSimilarBar height={height} label={label} value={value} testID={testID} />;
};
