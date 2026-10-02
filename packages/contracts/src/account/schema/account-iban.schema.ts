import * as Schema from 'effect/Schema';

export const AccountIbanSchema = Schema.String.check(
    Schema.isPattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/u, { message: 'Invalid IBAN format' }),
    Schema.isMinLength(15, { message: 'IBAN must be at least 15 characters' }),
    Schema.isMaxLength(34, { message: 'IBAN must not exceed 34 characters' })
);
