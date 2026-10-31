import { ACCOUNT_TITLE_MAX_LENGTH, ACCOUNT_TITLE_MIN_LENGTH } from '@budgie/contracts';
import * as Schema from 'effect/Schema';

export const MIN_INSTALLMENT_COUNT = 2;
export const MAX_INSTALLMENT_COUNT = 120;

export const ConvertToInstallmentFormSchema = Schema.Struct({
    installmentCount: Schema.Finite.check(
        Schema.isInt(),
        Schema.isGreaterThanOrEqualTo(MIN_INSTALLMENT_COUNT),
        Schema.isLessThanOrEqualTo(MAX_INSTALLMENT_COUNT)
    ),
    totalAmount: Schema.NullOr(Schema.Finite.check(Schema.isGreaterThan(0))),
    feePercent: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
    title: Schema.Trim.check(Schema.isMinLength(ACCOUNT_TITLE_MIN_LENGTH), Schema.isMaxLength(ACCOUNT_TITLE_MAX_LENGTH))
});

export type ConvertToInstallmentFormValues = typeof ConvertToInstallmentFormSchema.Type;
