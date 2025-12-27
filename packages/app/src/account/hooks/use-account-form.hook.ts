import {
    AccountTypeEnum,
    LiabilityAccountCreateInputInterface,
    LiabilityAccountCreateInputSchema,
    UserIconNameEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

export const useAccountForm = (defaultValues: LiabilityAccountCreateInputInterface) => {
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

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    return {
        ...form,
        instrument
    };
};
