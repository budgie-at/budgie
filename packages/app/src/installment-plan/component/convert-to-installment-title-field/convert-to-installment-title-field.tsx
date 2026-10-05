import { useLingui } from '@lingui/react/macro';
import { Controller, useFormContext } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { UseControllerReturn } from 'react-hook-form';

export const ConvertToInstallmentTitleField = () => {
    const { t } = useLingui();
    const { control } = useFormContext<ConvertToInstallmentFormValues>();

    const render = ({ field: { value, onChange, onBlur } }: UseControllerReturn<ConvertToInstallmentFormValues, 'title'>) => (
        <FormItem label={t`Name`}>
            <Input
                size="md"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t`Installment plan`}
                testID={ConvertToInstallmentModalSelector.TitleInput}
            />
        </FormItem>
    );

    return <Controller control={control} name="title" render={render} />;
};
