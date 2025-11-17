import { AccountCreateEntityInterface, AccountCreateEntitySchema } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instruments-by-id.query';

export const useAccountForm = (defaultValues: Partial<AccountCreateEntityInterface>) => {
    const form = useForm({
        resolver: zodResolver(AccountCreateEntitySchema),
        mode: 'onSubmit',
        defaultValues
    });

    const instrumentId = useWatch({
        control: form.control,
        name: 'instrumentId'
    });

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    const prepareSubmitData = (values: AccountCreateEntityInterface) => ({
        ...values,
        currentBalance: convertToMicroUnits(values.currentBalance ?? 0)
    });

    return {
        ...form,
        instrument,
        instrument,
        prepareSubmitData
    };
};
