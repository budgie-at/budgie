import { useLingui } from '@lingui/react/macro';
import { Control, Controller, FieldPath, UseControllerReturn } from 'react-hook-form';

import { AccountFormSelectors } from '../../../@e2e/selectors/account-form.selector';
import { CurrencySelector } from '../currency-selector/currency-selector';
import { FormItem } from '../form-item/form-item';

interface Props<T extends { instrumentId: number }> {
    readonly control: Control<T>;
}

export const CreateAccountCurrencyField = <T extends { instrumentId: number }>({ control }: Props<T>) => {
    const { t } = useLingui();

    const renderCurrencySelector = ({ field: { value, onChange } }: UseControllerReturn<T, FieldPath<T>>) => (
        <FormItem label={t`Currency`}>
            <CurrencySelector testID={AccountFormSelectors.CurrencySelector} instrumentId={value} onChange={onChange} />
        </FormItem>
    );

    return <Controller control={control} name={'instrumentId' as FieldPath<T>} render={renderCurrencySelector} />;
};
