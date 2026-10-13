import { ACCOUNT_TITLE_MAX_LENGTH, ACCOUNT_TITLE_MIN_LENGTH } from '@budgie/contracts';
import * as Schema from 'effect/Schema';

const MIN_INSTALLMENT_COUNT = 2;

export const ConvertToInstallmentFormSchema = Schema.Struct({
    installmentCount: Schema.Finite.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(MIN_INSTALLMENT_COUNT)),
    totalAmount: Schema.Finite.check(Schema.isGreaterThan(0)),
    feePercent: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
    title: Schema.Trim.check(Schema.isMinLength(ACCOUNT_TITLE_MIN_LENGTH), Schema.isMaxLength(ACCOUNT_TITLE_MAX_LENGTH))
});

export type ConvertToInstallmentFormValues = typeof ConvertToInstallmentFormSchema.Type;
