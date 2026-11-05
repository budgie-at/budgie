import { UserIconNameEnum } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { isPositiveNumber } from '@rnw-community/shared';

import { GroupedListInputRow } from '../../../@generic/component/grouped-list-input-row/grouped-list-input-row';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

interface Props {
    readonly name: 'customInterval' | 'endsAfterCount';
    readonly label: string;
    readonly testID: string;
}

const MAX_DIGITS = 3;

export const RecurringFormNumberRow = ({ name, label, testID }: Props) => {
    const { control, setValue } = useFormContext<RecurringSeriesFormValues>();
    const value = useWatch({ control, name });
    const text = isPositiveNumber(value) ? String(value) : '';

    const handleChangeText = (nextText: string) => {
        setValue(name, Number(nextText.replaceAll(/\D/gu, '')));
    };

    return (
        <GroupedListInputRow
            icon={UserIconNameEnum.Hash}
            label={label}
            value={text}
            onChangeText={handleChangeText}
            keyboardType="number-pad"
            maxLength={MAX_DIGITS}
            placeholder="0"
            testID={testID}
        />
    );
};
