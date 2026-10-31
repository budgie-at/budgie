import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, FieldPathByValue, FieldValues, useController } from 'react-hook-form';

import { isString } from '@rnw-community/shared';

import { GroupedListInputRow } from '../../../@generic/component/grouped-list-input-row/grouped-list-input-row';

interface Props<TFieldValues extends FieldValues> {
    readonly control: Control<TFieldValues>;
    readonly name: FieldPathByValue<TFieldValues, string>;
    readonly placeholder: string;
    readonly testID: string;
}

export const BudgetNameField = <TFieldValues extends FieldValues>({ control, name, placeholder, testID }: Props<TFieldValues>) => {
    const { t } = useLingui();
    const {
        field: { value, onChange, onBlur }
    } = useController({ control, name });

    const nameValue = isString(value) ? value : '';

    return (
        <GroupedListInputRow
            icon={UserIconNameEnum.Type}
            label={t`Name`}
            testID={testID}
            value={nameValue}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
        />
    );
};
