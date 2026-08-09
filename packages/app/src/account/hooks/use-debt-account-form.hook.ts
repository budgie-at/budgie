import { AccountEntityInterface, DebtAccountCreateInputInterface, DebtAccountCreateInputSchema } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Resolver, useWatch } from 'react-hook-form';

import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

import { useAccountEntityForm } from './use-account-entity-form.hook';

interface DebtAccountFormValues extends Omit<DebtAccountCreateInputInterface, 'contactId' | 'deadline'> {
    readonly contactId: string | null;
    readonly deadline: Date | null;
    readonly includeInNetWorth?: boolean;
}

export const useDebtAccountForm = (
    initialValues: DebtAccountFormValues,
    onSubmit: (values: DebtAccountFormValues) => Promise<AccountEntityInterface>,
    syncInitialValues = false
) => {
    const form = useAccountEntityForm(
        zodResolver(DebtAccountCreateInputSchema) as Resolver<DebtAccountFormValues>,
        initialValues,
        onSubmit,
        syncInitialValues
    );

    const [instrumentId, debtType] = useWatch({
        control: form.control,
        name: ['instrumentId', 'debtType']
    });

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    return { ...form, debtType, instrument };
};
