import {
    AccountDebtTypeEnum,
    AccountNatureEnum,
    AccountTypeEnum,
    DebtAccountCreateInputInterface,
    DebtAccountCreateInputSchema,
    UserIconNameEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

export const useDebtAccountForm = (defaultValues: DebtAccountCreateInputInterface) => {
    const form = useForm({
        resolver: zodResolver(DebtAccountCreateInputSchema),
        mode: 'onSubmit',
        defaultValues: {
            nature: AccountNatureEnum.LIABILITY,
            debtType: AccountDebtTypeEnum.LENT,
            icon: UserIconNameEnum.Home,
            type: AccountTypeEnum.DEBT,
            currentBalance: 0,
            instrumentId: 1,
            title: ''
        },
        values: defaultValues
    });

    const [instrumentId, debtType] = useWatch({
        control: form.control,
        name: ['instrumentId', 'debtType']
    });

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    return {
        ...form,
        debtType,
        instrument
    };
};
