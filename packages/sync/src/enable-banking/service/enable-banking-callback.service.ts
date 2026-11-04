import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { EnableBankingCallbackFailureEnum } from '../enum/enable-banking-callback-failure.enum';
import { EnableBankingCallbackError } from '../error/enable-banking-callback.error';

import type { EnableBankingPendingAuthorizationInterface } from '../interface/enable-banking-pending-authorization.interface';

export class EnableBankingCallbackService extends Context.Service<EnableBankingCallbackService>()(
    '@budgie/sync/EnableBankingCallbackService',
    {
        make: Effect.sync(() => {
            const consumedStates = new Set<string>();

            const fail = (failure: EnableBankingCallbackFailureEnum) => new EnableBankingCallbackError({ failure });

            const decodeParameters = (query: string) =>
                Effect.try({
                    try: () =>
                        query.split('&').map(parameter => {
                            const separatorIndex = parameter.indexOf('=');
                            const name = separatorIndex === -1 ? parameter : parameter.slice(0, separatorIndex);
                            const value = separatorIndex === -1 ? '' : parameter.slice(separatorIndex + 1);

                            return [decodeURIComponent(name), decodeURIComponent(value)] as const;
                        }),
                    catch: () => fail(EnableBankingCallbackFailureEnum.MALFORMED)
                });

            return {
                resolveCode: Effect.fn('EnableBankingCallbackService.resolveCode')(function* (
                    pending: EnableBankingPendingAuthorizationInterface,
                    callbackUrl: string
                ) {
                    const [baseUrl, query, ...extraParts] = callbackUrl.split('?');
                    if (
                        baseUrl !== pending.callbackUrl ||
                        !isNotEmptyString(query) ||
                        isNotEmptyArray(extraParts) ||
                        callbackUrl.includes('#')
                    ) {
                        return yield* fail(EnableBankingCallbackFailureEnum.MALFORMED);
                    }

                    const parameters = yield* decodeParameters(query);
                    const valuesOf = (name: string) =>
                        parameters.filter(([parameterName]) => parameterName === name).map(([, value]) => value);
                    const states = valuesOf('state');
                    if (states.length !== 1 || states[0] !== pending.state) {
                        return yield* fail(EnableBankingCallbackFailureEnum.STATE_MISMATCH);
                    }

                    if (consumedStates.has(pending.state)) {
                        return yield* fail(EnableBankingCallbackFailureEnum.REPLAYED);
                    }
                    consumedStates.add(pending.state);

                    if ((yield* Clock.currentTimeMillis) >= pending.expiresAtMs) {
                        return yield* fail(EnableBankingCallbackFailureEnum.EXPIRED);
                    }

                    if (isNotEmptyArray(valuesOf('error'))) {
                        return yield* fail(EnableBankingCallbackFailureEnum.CANCELLED);
                    }

                    const codes = valuesOf('code');
                    const [code] = codes;
                    if (codes.length !== 1 || !isNotEmptyString(code)) {
                        return yield* fail(EnableBankingCallbackFailureEnum.MALFORMED);
                    }

                    return code;
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(EnableBankingCallbackService, EnableBankingCallbackService.make);
}
