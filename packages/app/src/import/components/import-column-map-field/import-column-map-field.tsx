import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { isNotEmptyString } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ImportColumnMapFormValues } from '../../schema/import-column-map.schema';
import { ImportColumnMapper } from '../import-column-mapper/import-column-mapper';

interface Props {
    readonly control: Control<ImportColumnMapFormValues>;
    readonly name: keyof ImportColumnMapFormValues;
    readonly label: string;
    readonly headers: string[];
    readonly selectedHeaders: string[];
    readonly isRequired?: boolean;
}

export const ImportColumnMapField = ({ control, name, label, headers, selectedHeaders, isRequired = false }: Props) => {
    const renderField = ({ field: { value, onChange }, fieldState: { error } }: UseControllerReturn<ImportColumnMapFormValues>) => {
        const handleClear = () => void onChange('');

        return (
            <FormItem isRequired={isRequired} label={label} error={error?.message} className="gap-y-xs">
                <ImportColumnMapper
                    value={value}
                    headers={headers}
                    selectedHeaders={selectedHeaders}
                    fieldLabel={label}
                    onSelect={onChange}
                    onClear={handleClear}
                    hasError={isNotEmptyString(error)}
                />
            </FormItem>
        );
    };

    return <Controller control={control} name={name} render={renderField} />;
};
