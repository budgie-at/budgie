import { AccountEntityInterface, DebtAccountCreateInputInterface, DebtAccountCreateInputSchema } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as Schema from 'effect/Schema';
import { useWatch } from 'react-hook-form';

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
        standardSchemaResolver(Schema.toStandardSchemaV1(DebtAccountCreateInputSchema)),
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
