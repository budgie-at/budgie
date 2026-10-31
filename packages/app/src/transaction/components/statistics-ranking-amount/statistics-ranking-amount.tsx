import { TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { cva } from 'class-variance-authority';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly amount: number;
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
    readonly testID: string;
}

const AMOUNT_STYLE = { fontVariant: ['tabular-nums' as const] };

const amountVariants = cva('text-[15px] font-medium', {
    variants: {
        type: {
            [TransactionTypeEnum.INCOME]: 'text-positive-foreground',
            [TransactionTypeEnum.EXPENSE]: 'text-primary'
        }
    }
});

export const StatisticsRankingAmount = ({ amount, type, testID }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    const sign = type === TransactionTypeEnum.INCOME ? '+' : '';
    const formattedAmount = `${sign}${formatDigits(convertFromMicroUnits(amount), defaultInstrument.symbol)}`;

    return (
        <ProtectedText
            numberOfLines={1}
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            style={AMOUNT_STYLE}
            className={amountVariants({ type })}
            testID={testID}
        >
            {formattedAmount}
        </ProtectedText>
    );
};
