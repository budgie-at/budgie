import { AccountEntityInterface, LiabilityAccountCreateInputInterface, LiabilityAccountCreateInputSchema } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

export const useAccountForm = (
    values: LiabilityAccountCreateInputInterface,
    onSubmit: (values: LiabilityAccountCreateInputInterface) => Promise<AccountEntityInterface>
) => {
    const showError = useShowError();
    const form = useForm({
        resolver: zodResolver(LiabilityAccountCreateInputSchema),
        mode: 'onSubmit',
        values,
        resetOptions: {
            keepDirtyValues: true
        }
    });

    const instrumentId = useWatch({
        control: form.control,
        name: 'instrumentId'
    });
    const { isSubmitting } = form.formState;

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
        isSubmitting,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
