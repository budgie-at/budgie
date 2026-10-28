import { LiabilityAccountCreateInputInterface, LiabilityAccountCreateInputSchema } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as Schema from 'effect/Schema';
import { useWatch } from 'react-hook-form';

import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';

import { useAccountEntityForm } from './use-account-entity-form.hook';

export const useLiabilityAccountForm = (
    values: LiabilityAccountCreateInputInterface,
    onSubmit: Parameters<typeof useAccountEntityForm<LiabilityAccountCreateInputInterface>>[2]
): ReturnType<typeof useAccountEntityForm<LiabilityAccountCreateInputInterface>> & {
    readonly instrument: ReturnType<typeof useGetInstrumentByIdQuery>['instrument'];
} => {
    const form = useAccountEntityForm(
        standardSchemaResolver(Schema.toStandardSchemaV1(LiabilityAccountCreateInputSchema)),
        values,
        onSubmit
    );

    const instrumentId = useWatch({ control: form.control, name: 'instrumentId' });

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    return { ...form, instrument };
};
