import { AccountEntityInterface, LiabilityAccountCreateInputInterface, LiabilityAccountCreateInputSchema } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

export const useAccountForm = (
    defaultValues: LiabilityAccountCreateInputInterface,
    onSubmit: (values: LiabilityAccountCreateInputInterface) => Promise<AccountEntityInterface>
) => {
    const showError = useShowError();
    const defaultValuesRef = useRef(defaultValues);
    const form = useForm({
        resolver: zodResolver(LiabilityAccountCreateInputSchema),
        mode: 'onSubmit',
        defaultValues
    });

    const { reset } = form;

    const instrumentId = useWatch({
        control: form.control,
        name: 'instrumentId'
    });

    useEffect(() => {
        if (defaultValuesRef.current !== defaultValues) {
            defaultValuesRef.current = defaultValues;
            reset(defaultValues, { keepDirtyValues: true });
        }
    }, [defaultValues, reset]);

    const handleSubmit = async (values: LiabilityAccountCreateInputInterface) => {
        try {
            await onSubmit(values);

            router.replace('/');
        } catch (error: unknown) {
            showError(error);
        }
    };

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    return {
        ...form,
        instrument,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
