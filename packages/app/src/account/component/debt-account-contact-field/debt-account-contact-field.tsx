import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';

import { ContactSelector } from '../../../@generic/component/contact-selector/contact-selector';
import { FormItem } from '../../../@generic/component/form-item/form-item';

interface Props<T extends { contactId: string | null }> {
    readonly control: Control<T>;
}

export const DebtAccountContactField = <T extends { contactId: string | null }>({ control }: Props<T>) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => (
        <FormItem label={t`Contact (optional)`}>
            <ContactSelector contactId={value} onSelect={onChange} />
        </FormItem>
    );

    return <Controller render={render} control={control} name={'contactId' as Path<T>} />;
};
