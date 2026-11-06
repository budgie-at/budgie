import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useRecurringDueLabel } from '../../hook/use-recurring-due-label.hook';

import type { RecurringSummaryInterface } from '../../interface/recurring-summary.interface';

interface Props {
    readonly countLabel: string;
    readonly nextPayment: RecurringSummaryInterface['nextPayment'];
    readonly now: Date;
}

export const RecurringSummarySubline = ({ countLabel, nextPayment, now }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const getDueLabel = useRecurringDueLabel();
    const { formatMonthAndDay } = useFormatDate();
    const nextDate = nextPayment?.nextDate;

    if (!isDefined(nextPayment) || !isDefined(nextDate)) {
        return <Text className="text-[15px] text-primary/65">{countLabel}</Text>;
    }

    const nextTitle = nextPayment.title;
    const nextAmount = protectAmount(convertFromMicroUnits(nextPayment.amount), defaultInstrument.symbol);
    const nextDue = getDueLabel(nextDate, now) ?? formatMonthAndDay(nextDate);

    return (
        <Text dynamicTypeRamp="subheadline" className="text-[15px] text-primary/65">
            {t`${countLabel} · Next: ${nextTitle} ${nextAmount} · ${nextDue}`}
        </Text>
    );
};
