import { UserIconNameEnum } from '@budgie/contracts';
import { ImportColumnMapFormValues } from '@budgie/import-export';
import { useLingui } from '@lingui/react/macro';
import { Control, useController } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { useImportColumnMapperModal } from '../../context/import-column-mapper-modal.context';
import { isImportColumnNameInformative } from '../../utils/is-import-column-name-informative.util';
import { ImportColumnMapperSelector } from '../import-column-mapper/import-column-mapper.selector';

interface Props {
    readonly control: Control<ImportColumnMapFormValues>;
    readonly name: keyof ImportColumnMapFormValues;
    readonly label: string;
    readonly samples: Record<string, readonly string[]>;
    readonly headers: string[];
    readonly selectedHeaders: string[];
    readonly isRequired?: boolean;
}

export const ImportColumnMapField = ({ control, name, label, headers, selectedHeaders, samples, isRequired = false }: Props) => {
    const { t } = useLingui();
    const {
        field: { value, onChange },
        fieldState: { error }
    } = useController({ control, name });
    const [openImportColumnMapper] = useImportColumnMapperModal();

    const handleOpen = () => {
        openImportColumnMapper({ headers, selectedHeaders, samples, currentValue: value, fieldLabel: label, isRequired }, result => {
            if (isDefined(result)) {
                onChange(result.type === 'select' ? result.header : '');
            }
        });
    };

    const emptyValue = isRequired ? t`Choose` : t`None`;
    const displayValue = isNotEmptyString(value) ? value : emptyValue;
    const showColumnName = !isNotEmptyString(value) || isImportColumnNameInformative(value, label);
    const sampleSubtitle = isNotEmptyString(value) ? samples[value]?.[0] : null;
    const subtitle = isDefined(error) ? <Text className="text-destructive-foreground text-[13px]">{error.message}</Text> : sampleSubtitle;

    const baseClassName = 'shrink text-secondary-foreground text-[17px]';
    const valueClassName = cn(
        baseClassName,
        isRequired && !isNotEmptyString(value) && 'text-primary',
        isDefined(error) && 'text-destructive-foreground'
    );

    return (
        <GroupedListRow
            title={label}
            subtitle={subtitle}
            onPress={handleOpen}
            testID={ImportColumnMapperSelector.Row(name)}
            right={
                <View className="max-w-[55%] flex-row items-center gap-x-md">
                    {showColumnName ? (
                        <Text className={valueClassName} numberOfLines={1} ellipsizeMode="tail">
                            {displayValue}
                        </Text>
                    ) : null}
                    <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
                </View>
            }
        />
    );
};
