import { AccountEntityInterface } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { DefaultValues, FieldErrors, FieldValues, Resolver, useForm } from 'react-hook-form';

import { isNotEmptyString } from '@rnw-community/shared';

import { useShowError } from '../../@generic/hook/use-show-error.hook';

export const useAccountEntityForm = <T extends FieldValues>(
    resolver: Resolver<T>,
    initialValues: DefaultValues<T>,
    onSubmit: (values: T) => Promise<AccountEntityInterface>,
    syncInitialValues = false
) => {
    const showError = useShowError();
    const form = useForm<T>({
        resolver,
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

    const handleSubmit = async (values: T) => {
        try {
            await onSubmit(values);

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
