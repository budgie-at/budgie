import { DateRangeInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { TransactionFiltersSelectors } from '../../../@e2e/selectors/transaction-filters.selector';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionFilterChip } from '../../../transaction/components/transaction-filter-chip/transaction-filter-chip';
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

        if (isDefined(value.from) && isDefined(value.to)) {
            return value.from.getFullYear() === value.to.getFullYear()
                ? `${formatMonthAndDay(value.from)} – ${formatMonthAndDay(value.to)}`
                : `${formatDayAndMonthAndYear(value.from)} – ${formatDayAndMonthAndYear(value.to)}`;
        }

        if (isDefined(value.from)) {
            return formatMonthAndDay(value.from);
        }

        if (isDefined(value.to)) {
            return formatMonthAndDay(value.to);
        }

        return t`Date`;
    };

    const hasDateFilterSelected = isDefined(value?.from) || isDefined(value?.to);
    const label = getLabel();
    const chipTestID = hasDateFilterSelected
        ? TransactionFiltersSelectors.DateChipActive
        : TransactionFiltersSelectors.DateChip;

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
