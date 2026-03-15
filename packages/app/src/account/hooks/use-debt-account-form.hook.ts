import {
    AccountDebtTypeEnum,
    AccountEntityInterface,
    AccountTypeEnum,
    DebtAccountCreateInputInterface,
    DebtAccountCreateInputSchema,
    UserIconNameEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Resolver, useForm, useWatch } from 'react-hook-form';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

interface DebtAccountFormValues extends Omit<DebtAccountCreateInputInterface, 'contactId' | 'deadline'> {
    readonly contactId: string | null;
    readonly deadline: Date | null;
    readonly includeInNetWorth?: boolean;
}

export const useDebtAccountForm = (
    defaultValues: DebtAccountFormValues,
    onSubmit: (values: DebtAccountFormValues) => Promise<AccountEntityInterface>
) => {
    const showError = useShowError();
    const form = useForm<DebtAccountFormValues>({
        resolver: zodResolver(DebtAccountCreateInputSchema) as Resolver<DebtAccountFormValues>,
        mode: 'onSubmit',
        defaultValues: {
            debtType: AccountDebtTypeEnum.LENT,
            icon: UserIconNameEnum.Home,
            type: AccountTypeEnum.DEBT,
            targetBalance: 0,
            instrumentId: 0,
            includeInNetWorth: false,
            contactId: null,
            deadline: null,
            title: ''
        },
        values: defaultValues
    });

    const [instrumentId, debtType] = useWatch({
        control: form.control,
        name: ['instrumentId', 'debtType']
    });

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    const handleSubmit = async (values: DebtAccountFormValues) => {
        try {
            await onSubmit(values);

            router.replace('/');
        } catch (error: unknown) {
            showError(error);
        }
    };

    return {
        ...form,
        debtType,
        instrument,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
