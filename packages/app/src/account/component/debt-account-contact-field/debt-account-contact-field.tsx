import { DebtAccountCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { ContactSelector } from '../../../@generic/component/contact-selector/contact-selector';
import { FormItem } from '../../../@generic/component/form-item/form-item';

interface Props {
    readonly control: Control<DebtAccountCreateInputInterface>;
}

export const DebtAccountContactField = ({ control }: Props) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<DebtAccountCreateInputInterface, 'contactId'>) => (
        <FormItem label={t`Contact (optional)`}>
            <ContactSelector contactId={value} onSelect={onChange} />
        </FormItem>
    );

    return <Controller render={render} control={control} name="contactId" />;
};
