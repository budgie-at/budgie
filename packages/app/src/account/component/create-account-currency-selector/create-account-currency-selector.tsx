import { useLingui } from '@lingui/react/macro';

import { CurrencySelector } from '../../../@generic/components/currency-selector/currency-selector';
import { FormItem } from '../../../@generic/components/form-item/form-item';

interface Props {
    readonly field: { value?: number; onChange: (value: number) => void };
}

export const CreateAccountCurrencySelector = ({ field: { value, onChange } }: Props) => {
    const { t } = useLingui();

    return (
        <FormItem label={t`Currency`}>
            <CurrencySelector instrumentId={value} onChange={onChange} />
        </FormItem>
    );
};
