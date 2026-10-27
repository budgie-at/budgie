import { AccountEntityInterface, DepositAccountCreateInputSchema } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as Schema from 'effect/Schema';
import { useWatch } from 'react-hook-form';

import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';
import { DepositAccountFormValues } from '../interface/deposit-account-form-values.interface';

import { useAccountEntityForm } from './use-account-entity-form.hook';

import type { AppServices } from '../../@generic/runtime/app.runtime';
import type * as Effect from 'effect/Effect';

export const useDepositAccountForm = (
    initialValues: DepositAccountFormValues,
    onSubmit: (values: DepositAccountFormValues) => Effect.Effect<AccountEntityInterface, unknown, AppServices>
): ReturnType<typeof useAccountEntityForm<DepositAccountFormValues>> & {
    readonly instrument: ReturnType<typeof useGetInstrumentByIdQuery>['instrument'];
} => {
    const form = useAccountEntityForm(
        standardSchemaResolver(Schema.toStandardSchemaV1(DepositAccountCreateInputSchema)),
        initialValues,
        onSubmit
    );

    const instrumentId = useWatch({ control: form.control, name: 'instrumentId' });

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    return { ...form, instrument };
};
