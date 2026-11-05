import { useController, useFormContext } from 'react-hook-form';

import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

export const RecurringFormCurrencyField = () => {
    const { control } = useFormContext<RecurringSeriesFormValues>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'instrumentId' });
    const { instrument } = useGetInstrumentByIdQuery(value);

    return (
        <GroupedListSection>
            <CreateAccountCurrencyField value={value} onChange={onChange} instrumentType={instrument?.type} />
        </GroupedListSection>
    );
};
