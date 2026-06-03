import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { DateType } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

import { useVibration } from '../../hook/use-vibration.hook';
import { dateTypeToDate } from '../../utils/date/date-type-to-date.util';

import { DatePicker } from './date-picker';

interface Props {
    readonly date: Date | null;
    readonly onChange: (value: Date) => void;
}

export const SingleDatePicker = ({ date, onChange }: Props) => {
    const [, hapticImpact] = useVibration();

    const handleChange = (value: { date: DateType }) => {
        const resolved = dateTypeToDate(value.date);

        if (isDefined(resolved)) {
            hapticImpact(ImpactFeedbackStyle.Light);
            onChange(resolved);
        }
    };

    return <DatePicker date={date ?? new Date()} mode="single" onChange={handleChange} />;
};
