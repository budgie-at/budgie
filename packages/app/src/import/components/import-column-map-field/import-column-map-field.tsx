import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

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
            <View className="gap-y-xs">
                <View className="flex-row items-center gap-x-xs">
                    <Text className="text-secondary-foreground text-sm font-medium">{label}</Text>
                    {isRequired && <Text className="text-destructive-foreground text-sm">*</Text>}
                </View>
                <ImportColumnMapper
                    value={value}
                    headers={headers}
                    selectedHeaders={selectedHeaders}
                    fieldLabel={label}
                    onSelect={onChange}
                    onClear={handleClear}
                    hasError={isNotEmptyString(error)}
                />
                {isNotEmptyString(error) && <Text className="text-destructive-foreground text-xs">{error}</Text>}
            </View>
        );
    };

    return (
        <View>
            <Controller control={control} name={name} render={renderField} />
        </View>
    );
};
