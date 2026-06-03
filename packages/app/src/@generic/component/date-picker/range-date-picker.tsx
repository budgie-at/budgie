import { DateRangeInterface } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { DateType } from 'react-native-ui-datepicker';

import { useVibration } from '../../hook/use-vibration.hook';
import { dateTypeToDate } from '../../utils/date/date-type-to-date.util';

import { DatePicker } from './date-picker';

interface Props {
    readonly range: DateRangeInterface | null;
    readonly onChange: (range: DateRangeInterface) => void;
}

export const RangeDatePicker = ({ range, onChange }: Props) => {
    const [, hapticImpact] = useVibration();

    const handleChange = (value: { startDate?: DateType; endDate?: DateType }) => {
        hapticImpact(ImpactFeedbackStyle.Light);
        onChange({
            from: dateTypeToDate(value.startDate),
            to: dateTypeToDate(value.endDate)
        });
    };

    return <DatePicker startDate={range?.from} endDate={range?.to} mode="range" onChange={handleChange} />;
};
