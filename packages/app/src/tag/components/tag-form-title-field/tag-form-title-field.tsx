import { CATEGORY_TITLE_MAX_LENGTH, TagCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { BottomSheetTextInput } from '../../../@generic/components/bottom-sheet-input/bottom-sheet-view';
import { FormItem } from '../../../@generic/components/form-item/form-item';
import { Shake } from '../../../@generic/components/shake/shake';

interface Props {
    readonly control: Control<TagCreateEntityInterface>;
}

export const TagFormTitleField = ({ control }: Props) => {
    const { t } = useLingui();

    const render = ({
        field: { value, onChange },
        fieldState: { error, invalid }
    }: UseControllerReturn<TagCreateEntityInterface, 'title'>) => {
        const variant = invalid ? 'destructive' : 'default'

        return (
            <FormItem label={t`Tag Name`} error={error?.message}>
                <Shake isEnabled={invalid}>
                    <BottomSheetTextInput
                        value={value}
                        variant={variant}
                        onChangeText={onChange}
                        placeholder={t`Tag name`}
                        maxLength={CATEGORY_TITLE_MAX_LENGTH}
                        className="text-md text-primary placeholder:text-secondary-foreground h-[56px] px-5xl bg-secondary-background rounded-5xl border border-secondary-corner"
                    />
                </Shake>
            </FormItem>
        )
    };

    return <Controller name="title" control={control} render={render} />;
};
