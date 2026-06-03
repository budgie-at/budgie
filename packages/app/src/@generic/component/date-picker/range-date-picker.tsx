import { DateRangeInterface } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { DateType } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

import { useVibration } from '../../hook/use-vibration.hook';
import { dateTypeToDate } from '../../utils/date/date-type-to-date.util';
import { getDateRangeForDay } from '../../utils/date/get-date-range-for-day.util';

import { DatePicker } from './date-picker';

interface Props {
    readonly range: DateRangeInterface | null;
    readonly calendarResetKey: number;
    readonly visibleDate: Date | null;
    readonly onChange: (range: DateRangeInterface) => void;
}

export const RangeDatePicker = ({ range, calendarResetKey, visibleDate, onChange }: Props) => {
    const [, hapticImpact] = useVibration();

    const handleChange = (value: { startDate?: DateType; endDate?: DateType }) => {
        hapticImpact(ImpactFeedbackStyle.Light);
        const from = dateTypeToDate(value.startDate);
        const to = dateTypeToDate(value.endDate);

        if (isDefined(from) && !isDefined(to)) {
            onChange(getDateRangeForDay(from));

            return;
        }

        onChange({
            from,
            to
        });
    };

    return (
        <DatePicker
            key={calendarResetKey}
            startDate={range?.from}
            endDate={range?.to}
            mode="range"
            month={visibleDate?.getMonth()}
            year={visibleDate?.getFullYear()}
            onChange={handleChange}
        />
    );
};
