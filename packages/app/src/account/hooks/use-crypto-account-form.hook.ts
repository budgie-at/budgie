import {
    AccountEntityInterface,
    AccountTypeEnum,
    CryptoAccountCreateInputInterface,
    CryptoAccountCreateInputSchema,
    UserIconNameEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

export const useCryptoAccountForm = (
    defaultValues: CryptoAccountCreateInputInterface,
    onSubmit: (values: CryptoAccountCreateInputInterface) => Promise<AccountEntityInterface>
) => {
    const showError = useShowError();
    const form = useForm<CryptoAccountCreateInputInterface>({
        resolver: zodResolver<CryptoAccountCreateInputInterface, unknown, CryptoAccountCreateInputInterface>(
            CryptoAccountCreateInputSchema
        ),
        mode: 'onSubmit',
        defaultValues: {
            icon: UserIconNameEnum.Bitcoin,
            type: AccountTypeEnum.CRYPTO,
            currentBalance: 0,
            instrumentId: 0,
            includeInNetWorth: true,
            title: ''
        },
        values: defaultValues
    });

    const instrumentId = useWatch({
        control: form.control,
        name: 'instrumentId'
    });

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    const handleSubmit = async (values: CryptoAccountCreateInputInterface) => {
        try {
            await onSubmit(values);

            router.replace('/');
        } catch (error: unknown) {
            showError(error);
        }
    };

    return {
        ...form,
        instrument,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
