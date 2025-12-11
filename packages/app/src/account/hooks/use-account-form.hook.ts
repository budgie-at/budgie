import { AccountCreateEntityInterface, AccountCreateEntitySchema } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

export const useAccountForm = (defaultValues: AccountCreateEntityInterface) => {
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

    return {
        ...form,
        instrument
    };
};
