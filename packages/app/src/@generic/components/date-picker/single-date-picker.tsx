import { DateType } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

import { DatePicker } from './date-picker';

interface Props {
    readonly date: Date;
    readonly onChange: (value: Date) => void;
}

export const SingleDatePicker = ({ date, onChange }: Props) => {
    const handleChange = (value: { date: DateType }) => {
        onChange(isDefined(value.date) ? new Date(value.date.toString()) : new Date());
    };

    return <DatePicker date={date} mode="single" onChange={handleChange} />;
};
