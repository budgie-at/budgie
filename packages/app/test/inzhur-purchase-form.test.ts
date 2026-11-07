import { expect, it } from '@effect/vitest';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { createFormControl } from 'react-hook-form';

import { InzhurPurchaseFormSchema } from '../src/inzhur/constant/inzhur-purchase-form-schema.constant';
import { buildInzhurPurchaseDefaults } from '../src/inzhur/utils/build-inzhur-purchase-defaults.util';

it.effect('notifies purchase validity subscribers when certificates and amount change', () =>
    Effect.gen(function* () {
        const form = createFormControl({
            mode: 'onChange',
            resolver: standardSchemaResolver(Schema.toStandardSchemaV1(InzhurPurchaseFormSchema)),
            defaultValues: buildInzhurPurchaseDefaults({ remainingAmount: 2000, operatedAt: new Date('2026-11-01') }, 'Inzhur Energy')
        });
        const validity: boolean[] = [];
        const unsubscribe = form.subscribe({ formState: { isValid: true }, callback: state => validity.push(state.isValid ?? false) });
        const fund = form.register('fundName');
        const certificates = form.register('certificates');
        const amount = form.register('amount');
        form.register('operatedAt');
        expect(yield* Effect.promise(() => form.trigger())).toBe(false);
        yield* Effect.promise(() => fund.onChange({ target: { name: 'fundName', value: 'Inzhur MilTech' }, type: 'change' }));
        yield* Effect.promise(() => certificates.onChange({ target: { name: 'certificates', value: 1 }, type: 'change' }));
        yield* Effect.promise(() => amount.onChange({ target: { name: 'amount', value: 1000 }, type: 'change' }));
        expect(validity).toContain(true);
        expect(yield* Effect.promise(() => form.trigger())).toBe(true);
        yield* Effect.promise(() => certificates.onChange({ target: { name: 'certificates', value: 0 }, type: 'change' }));
        expect(validity.at(-1)).toBe(false);
        unsubscribe();
    })
);
