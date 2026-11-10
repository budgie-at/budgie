import { UserIconNameEnum } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { usePickDate } from '../../../@generic/hook/use-pick-date.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

interface Props {
    readonly name: 'anchorDate' | 'endsOn';
    readonly title: string;
    readonly testID: string;
}

export const RecurringFormDateRow = ({ name, title, testID }: Props) => {
    const { control, setValue } = useFormContext<RecurringSeriesFormValues>();
    const date = useWatch({ control, name });
    const pickDate = usePickDate();
    const { formatDayAndMonthAndYear } = useFormatDate();

    const handlePress = () => {
        pickDate(date, selectedDate => {
            setValue(name, selectedDate);
        });
    };

    return (
        <GroupedListValueRow
            icon={UserIconNameEnum.Calendar}
            title={title}
            value={formatDayAndMonthAndYear(date)}
            testID={testID}
            onPress={handlePress}
        />
    );
};
