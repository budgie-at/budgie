import { DateRangeInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionFilterChip } from '../../../transaction/components/transaction-filter-chip/transaction-filter-chip';
import { TransactionFiltersSelector } from '../../../transaction/components/transaction-filters/transaction-filters.selector';
import { DATE_PERIOD } from '../../constant/date-period.constant';
import { useDateFilterModal } from '../../context/date-filter-modal.context';
import { getPeriodByDateRange } from '../../utils/date/get-period-by-date-range.util';

interface Props {
    readonly value: DateRangeInterface | null;
    readonly onChange: (value: DateRangeInterface | null) => void;
}

export const DateFilter = ({ value, onChange }: Props) => {
    const { formatMonthAndDay, formatDayAndMonthAndYear } = useFormatDate();
    const { t } = useLingui();
    const [openDateFilter] = useDateFilterModal();

    const handleOpen = async () => {
        const result = await openDateFilter({ value });

        if (isDefined(result)) {
            onChange(result.value);
        }
    };

    const getLabel = () => {
        const period = getPeriodByDateRange(value);

        if (!isDefined(value)) {
            return t`Date`;
        }

        if (isDefined(period)) {
            return t(DATE_PERIOD[period]);
        }

        const { from, to } = value;

        if (isDefined(from) && isDefined(to)) {
            const isSameDate =
                from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth() && from.getDate() === to.getDate();

            if (isSameDate) {
                return formatMonthAndDay(from);
            }

            return from.getFullYear() === to.getFullYear()
                ? `${formatMonthAndDay(from)} – ${formatMonthAndDay(to)}`
                : `${formatDayAndMonthAndYear(from)} – ${formatDayAndMonthAndYear(to)}`;
        }

        if (isDefined(from)) {
            return formatMonthAndDay(from);
        }

        return isDefined(to) ? formatMonthAndDay(to) : t`Date`;
    };

    const hasDateFilterSelected = isDefined(value?.from) || isDefined(value?.to);
    const label = getLabel();
    const chipTestID = hasDateFilterSelected ? TransactionFiltersSelector.DateChipActive : TransactionFiltersSelector.DateChip;

    return (
        <TransactionFilterChip
            isActive={hasDateFilterSelected}
            icon={UserIconNameEnum.Calendar}
            label={label}
            onPress={handleOpen}
            testID={chipTestID}
        />
    );
};
