import { AccountCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { CurrencySelector } from '../currency-selector/currency-selector';
import { FormItem } from '../form-item/form-item';

interface Props {
    readonly control: Control<AccountCreateEntityInterface>;
}

export const CreateAccountCurrencyField = ({ control }: Props) => {
    const { t } = useLingui();

    const renderCurrencySelector = ({ field: { value, onChange } }: UseControllerReturn<AccountCreateEntityInterface, 'instrumentId'>) => (
        <FormItem label={t`Currency`}>
            <CurrencySelector instrumentId={value} onChange={onChange} />
        </FormItem>
    );

    return <Controller control={control} name="instrumentId" render={renderCurrencySelector} />;
};
