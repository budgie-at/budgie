import { AccountEntityInterface, LiabilityAccountCreateInputInterface, LiabilityAccountCreateInputSchema } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { t } from '@lingui/core/macro';
import * as Schema from 'effect/Schema';
import { router } from 'expo-router';
import { FieldErrors, useForm, useWatch } from 'react-hook-form';

import { isNotEmptyString } from '@rnw-community/shared';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

export const useAccountForm = (
    values: LiabilityAccountCreateInputInterface,
    onSubmit: (values: LiabilityAccountCreateInputInterface) => Promise<AccountEntityInterface>
) => {
    const showError = useShowError();
    const form = useForm<LiabilityAccountCreateInputInterface>({
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(LiabilityAccountCreateInputSchema)),
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

    const handleInvalid = (errors: FieldErrors<LiabilityAccountCreateInputInterface>) => {
        const message = Object.values(errors).find(error => isNotEmptyString(error.message))?.message;

        showError(new Error(isNotEmptyString(message) ? message : t`Please check the account details`));
    };

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    return {
        ...form,
        instrument,
        isSubmitting,
        handleSubmit: form.handleSubmit(handleSubmit, handleInvalid)
    };
};
