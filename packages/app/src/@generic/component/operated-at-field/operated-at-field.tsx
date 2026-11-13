import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController } from 'react-hook-form';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { usePickDate } from '../../hook/use-pick-date.hook';
import { GroupedListSection } from '../grouped-list-section/grouped-list-section';
import { GroupedListValueRow } from '../grouped-list-value-row/grouped-list-value-row';

interface Props {
    readonly testID: string;
}

export const OperatedAtField = ({ testID }: Props) => {
    const { t } = useLingui();
    const { field } = useController<Record<'operatedAt', Date>, 'operatedAt'>({ name: 'operatedAt' });
    const { formatDayAndMonthAndYear } = useFormatDate();
    const pickDate = usePickDate();

    const handleOpen = () =>
        void pickDate(field.value, selectedDate => {
            field.onChange(selectedDate);
        });

    return (
        <GroupedListSection>
            <GroupedListValueRow
                icon={UserIconNameEnum.Calendar}
                title={t`Date`}
                value={formatDayAndMonthAndYear(field.value)}
                onPress={handleOpen}
                testID={testID}
            />
        </GroupedListSection>
    );
};
