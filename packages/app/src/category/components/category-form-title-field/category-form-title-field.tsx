import { CATEGORY_TITLE_MAX_LENGTH, CategoryCreateEntityInterface } from '@budgie/contracts';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/components/form-item/form-item';
import { Shake } from '../../../@generic/components/shake/shake';

interface Props {
    readonly control: Control<CategoryCreateEntityInterface>;
}

export const CategoryFormTitleField = ({ control }: Props) => {
    const { t } = useLingui();

    const render = ({
        field: { value, onChange },
        fieldState: { error, invalid }
    }: UseControllerReturn<CategoryCreateEntityInterface, 'title'>) => (
        <FormItem label={t`Category Name`} error={error?.message}>
            <Shake isEnabled={invalid}>
                <BottomSheetTextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder={t`Category name`}
                    maxLength={CATEGORY_TITLE_MAX_LENGTH}
                    className="text-md text-primary placeholder:text-secondary-foreground h-[56px] px-5xl bg-secondary-background rounded-5xl border border-secondary-corner"
                />
            </Shake>
        </FormItem>
    );

    return <Controller name="title" control={control} render={render} />;
};
