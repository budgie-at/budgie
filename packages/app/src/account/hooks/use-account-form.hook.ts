import {
    AccountEntityInterface,
    AccountTypeEnum,
    LiabilityAccountCreateInputInterface,
    LiabilityAccountCreateInputSchema,
    UserIconNameEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

export const useAccountForm = (
    defaultValues: LiabilityAccountCreateInputInterface,
    onSubmit: (values: LiabilityAccountCreateInputInterface) => Promise<AccountEntityInterface>
) => {
    const showError = useShowError();
    const form = useForm({
        resolver: zodResolver(LiabilityAccountCreateInputSchema),
        mode: 'onSubmit',
        defaultValues: {
            icon: UserIconNameEnum.Home,
            type: AccountTypeEnum.BANK,
            currentBalance: 0,
            instrumentId: 1,
            title: ''
        },
        values: defaultValues
    });

    const instrumentId = useWatch({
        control: form.control,
        name: 'instrumentId'
    });

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
