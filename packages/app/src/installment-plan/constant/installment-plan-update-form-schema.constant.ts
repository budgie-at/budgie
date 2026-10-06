import { DebtAccountCreateInputSchema } from '@budgie/contracts';
import * as Schema from 'effect/Schema';
import * as Struct from 'effect/Struct';

import { ConvertToInstallmentFormSchema } from './convert-to-installment-form-schema.constant';

export const InstallmentPlanUpdateFormSchema = Schema.Struct({
    ...Struct.pick(DebtAccountCreateInputSchema.fields, ['icon', 'title', 'targetBalance', 'includeInNetWorth', 'isActive']),
    installmentCount: ConvertToInstallmentFormSchema.fields.installmentCount
});

export type InstallmentPlanUpdateFormValues = typeof InstallmentPlanUpdateFormSchema.Type;
