import * as Schema from 'effect/Schema';

export class BiometricAuthenticationFailedError extends Schema.TaggedError<BiometricAuthenticationFailedError>()(
    'BiometricAuthenticationFailedError',
    {}
) {}
