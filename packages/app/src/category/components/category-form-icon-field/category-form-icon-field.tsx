import { CategoryCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { useIconSelectorModal } from '../../../@generic/context/icon-selector-modal.context';

interface Props {
    readonly control: Control<CategoryCreateEntityInterface>;
}

export const CategoryFormIconField = ({ control }: Props) => {
    const { t } = useLingui();
    const { openIconSelector } = useIconSelectorModal();

    const render = ({ field: { value, onChange }, fieldState: { error } }: UseControllerReturn<CategoryCreateEntityInterface, 'icon'>) => {
        const handlePress = async () => {
            const selectedIcon = await openIconSelector({ selectedIcon: value, variant: 'default' });

            if (selectedIcon) {
                onChange(selectedIcon);
            }
        };

        return (
            <FormItem label={t`Icon`} error={error?.message}>
                <HapticPressable onPress={handlePress}>
                    <SimpleHorizontalCell
                        title={value}
                        left={<CircleIcon icon={value} variant="default" size={36} iconSize={20} border={false} />}
                    />
                </HapticPressable>
            </FormItem>
        );
    };

    return <Controller name="icon" control={control} render={render} />;
};
