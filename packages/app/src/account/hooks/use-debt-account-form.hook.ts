import { AccountEntityInterface, DebtAccountCreateInputInterface, DebtAccountCreateInputSchema } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@lingui/core/macro';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { FieldErrors, Resolver, useForm, useWatch } from 'react-hook-form';

import { isNotEmptyString } from '@rnw-community/shared';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

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
    const showError = useShowError();
    const form = useForm<DebtAccountFormValues>({
        resolver: zodResolver(DebtAccountCreateInputSchema) as Resolver<DebtAccountFormValues>,
        mode: 'onSubmit',
        defaultValues: initialValues
    });
    const { dirtyFields, isSubmitting } = form.formState;
    const { reset } = form;

    useEffect(() => {
        if (!syncInitialValues) {
            return;
        }

        reset(initialValues, { keepDirtyValues: true });
    }, [dirtyFields, initialValues, reset, syncInitialValues]);

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

    const handleInvalid = (errors: FieldErrors<DebtAccountFormValues>) => {
        const message = Object.values(errors).find(error => isNotEmptyString(error.message))?.message;

        showError(new Error(isNotEmptyString(message) ? message : t`Please check the account details`));
    };

    return {
        ...form,
        debtType,
        instrument,
        isSubmitting,
        handleSubmit: form.handleSubmit(handleSubmit, handleInvalid)
    };
};
