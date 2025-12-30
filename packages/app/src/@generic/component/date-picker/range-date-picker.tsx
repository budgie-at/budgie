import { DateRangeInterface } from '@budgie/contracts';
import { DateType } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

import { DatePicker } from './date-picker';

interface Props {
    readonly range: DateRangeInterface | null;
    readonly onChange: (range: DateRangeInterface) => void;
}

export const RangeDatePicker = ({ range, onChange }: Props) => {
    const handleChange = (value: { startDate?: DateType; endDate?: DateType }) => {
        onChange({
            from: isDefined(value.startDate) ? new Date(value.startDate.toString()) : null,
            to: isDefined(value.endDate) ? new Date(value.endDate.toString()) : null
        });
    };

    return <DatePicker startDate={range?.from} endDate={range?.to} mode="range" onChange={handleChange} />;
};
