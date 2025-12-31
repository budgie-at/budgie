import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';

import { ContactSelector } from '../../../@generic/component/contact-selector/contact-selector';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';

interface Props<T extends { contactId: string | null }> {
    readonly control: Control<T>;
}

export const DebtAccountContactField = <T extends { contactId: string | null }>({ control }: Props<T>) => {
    const { t } = useLingui();

    const renderField = ({ field }: UseControllerReturn<T, Path<T>>) => (
        <FormItem label={t`Contact (optional)`}>
            <ContactSelector variant={ACCOUNT_COLOR.DEBT} contactId={field.value} onSelect={field.onChange} />
        </FormItem>
    );

    return <Controller render={renderField} control={control} name={'contactId' as Path<T>} />;
};
