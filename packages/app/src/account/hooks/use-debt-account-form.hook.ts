import {
    AccountDebtTypeEnum,
    AccountEntityInterface,
    AccountTypeEnum,
    DebtAccountCreateInputInterface,
    DebtAccountCreateInputSchema,
    UserIconNameEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

export const useDebtAccountForm = (
    defaultValues: DebtAccountCreateInputInterface,
    onSubmit: (values: DebtAccountCreateInputInterface) => Promise<AccountEntityInterface>
) => {
    const showError = useShowError();
    const form = useForm({
        resolver: zodResolver(DebtAccountCreateInputSchema),
        mode: 'onSubmit',
        defaultValues: {
            debtType: AccountDebtTypeEnum.LENT,
            icon: UserIconNameEnum.Home,
            type: AccountTypeEnum.DEBT,
            targetBalance: 0,
            instrumentId: 0,
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

    const handleSubmit = async (values: DebtAccountCreateInputInterface) => {
        try {
            await onSubmit(values);

            goBackOrReplace('/');
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
