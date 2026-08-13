import { AccountEntityInterface, DepositAccountCreateInputSchema } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Resolver, useWatch } from 'react-hook-form';

import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';
import { DepositAccountFormValues } from '../interface/deposit-account-form-values.interface';

import { useAccountEntityForm } from './use-account-entity-form.hook';

export const useDepositAccountForm = (
    initialValues: DepositAccountFormValues,
    onSubmit: (values: DepositAccountFormValues) => Promise<AccountEntityInterface>,
    syncInitialValues = false
) => {
    const form = useAccountEntityForm(
        zodResolver(DepositAccountCreateInputSchema) as Resolver<DepositAccountFormValues>,
        initialValues,
        onSubmit,
        syncInitialValues
    );

    const instrumentId = useWatch({ control: form.control, name: 'instrumentId' });

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    return { ...form, instrument };
};
