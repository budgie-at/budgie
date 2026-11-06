import { RecurringSeriesKindEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER } from '../../../transaction/constant/transaction-secondary-max-font-size-multiplier.constant';
import { useRecurringDueLabel } from '../../hook/use-recurring-due-label.hook';
import { RecurringAlertBadge } from '../recurring-alert-badge/recurring-alert-badge';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly series: RecurringSeriesListItemInterface;
    readonly isPossible: boolean;
    readonly now: Date;
}

const amountVariants = cva('text-[16px] font-semibold tabular-nums', {
    variants: { kind: { [RecurringSeriesKindEnum.EXPENSE]: 'text-primary', [RecurringSeriesKindEnum.INCOME]: 'text-positive-strong' } }
});

export const RecurringListRowTrailing = ({ series, isPossible, now }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const getDueLabel = useRecurringDueLabel();
    const formattedAmount = protectAmount(convertFromMicroUnits(series.amount), defaultInstrument.symbol);
    const amount = series.kind === RecurringSeriesKindEnum.INCOME ? `+${formattedAmount}` : formattedAmount;
    const dueLabel = isDefined(series.nextDate) && !isPossible ? getDueLabel(series.nextDate, now) : null;
    const detail = isDefined(series.alert) ? (
        <RecurringAlertBadge alert={series.alert} priceChange={series.priceChange} endsAt={series.endsAt} />
    ) : (
        <Text
            dynamicTypeRamp="footnote"
            maxFontSizeMultiplier={TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER}
            className="text-[13px] text-secondary-foreground tabular-nums"
        >
            {dueLabel}
        </Text>
    );

    return (
        <View className="shrink-0 items-end gap-y-xxs">
            <Text dynamicTypeRamp="headline" className={amountVariants({ kind: series.kind })}>
                {amount}
            </Text>
            {detail}
        </View>
    );
};
