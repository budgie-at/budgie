import { AccountEntityInterface } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';

import { isNotEmptyString } from '@rnw-community/shared';

import { useShowError } from '../../@generic/hook/use-show-error.hook';

import type { FieldErrors, FieldValues, Resolver, UseFormHandleSubmit, UseFormReturn } from 'react-hook-form';

export const useAccountEntityForm = <T extends FieldValues>(
    resolver: Resolver<T>,
    values: T,
    onSubmit: (values: T) => Promise<AccountEntityInterface>
): Omit<UseFormReturn<T>, 'handleSubmit'> & {
    readonly isSubmitting: boolean;
    readonly handleSubmit: ReturnType<UseFormHandleSubmit<T>>;
} => {
    const showError = useShowError();
    const form = useForm<T>({
        resolver,
        mode: 'onSubmit',
        values,
        resetOptions: { keepDirtyValues: true }
    });
    const { isSubmitting } = form.formState;

    const handleSubmit = async (submittedValues: T) => {
        try {
            await onSubmit(submittedValues);

            router.replace('/');
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleInvalid = (errors: FieldErrors<T>) => {
        const message = Object.values(errors).find(error => isNotEmptyString(error?.message))?.message;

        showError(new Error(isNotEmptyString(message) ? message : t`Please check the account details`));
    };

    return {
        ...form,
        isSubmitting,
        handleSubmit: form.handleSubmit(handleSubmit, handleInvalid)
    };
};
