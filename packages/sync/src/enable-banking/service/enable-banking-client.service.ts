import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Base64Url from 'effect/encoding/Base64Url';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';
import { SyncUnauthorizedError } from '../../core/error/sync-unauthorized.error';
import { SyncRequestSigner } from '../../core/port/sync-request-signer.port';
import { EnableBankingClient } from '../client/enable-banking.client';
import { EnableBankingTokenSchema } from '../constant/enable-banking-token.schema';

export class EnableBankingClientService extends Context.Service<EnableBankingClientService>()('@budgie/sync/EnableBankingClientService', {
    make: Effect.gen(function* () {
        const syncRequestSigner = yield* SyncRequestSigner;
        const millisecondsPerSecond = 1000;
        const jwtLifetimeSeconds = 23 * 60 * 60;
        const jwtRefreshMarginMs = 5 * 60 * millisecondsPerSecond;
        const decodeToken = Schema.decodeUnknownEffect(Schema.fromJsonString(EnableBankingTokenSchema));
        const jwtByApplicationId = new Map<string, { readonly jwt: string; readonly expiresAtMs: number }>();

        const encodeSigningInput = (applicationId: string, issuedAtSeconds: number) =>
            [
                { typ: 'JWT', alg: 'RS256', kid: applicationId },
                { iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat: issuedAtSeconds, exp: issuedAtSeconds + jwtLifetimeSeconds }
            ]
                .map(part => Base64Url.encode(JSON.stringify(part)))
                .join('.');

        const resolveClient = Effect.fnUntraced(function* (applicationId: string) {
            const nowMs = yield* Clock.currentTimeMillis;
            const cachedJwt = jwtByApplicationId.get(applicationId);
            if (isDefined(cachedJwt) && cachedJwt.expiresAtMs - jwtRefreshMarginMs > nowMs) {
                return new EnableBankingClient(cachedJwt.jwt);
            }

            const issuedAtSeconds = Math.floor(nowMs / millisecondsPerSecond);
            const signingInput = encodeSigningInput(applicationId, issuedAtSeconds);
            const jwt = `${signingInput}.${yield* syncRequestSigner.sign(applicationId, signingInput)}`;
            jwtByApplicationId.set(applicationId, { jwt, expiresAtMs: (issuedAtSeconds + jwtLifetimeSeconds) * millisecondsPerSecond });

            return new EnableBankingClient(jwt);
        });

        return {
            decodeCredentials: (token: string) =>
                decodeToken(token).pipe(
                    Effect.mapError(
                        () =>
                            new SyncInvalidResponseError({
                                provider: SyncProviderEnum.ENABLE_BANKING,
                                message: 'The stored bank authorization is not readable'
                            })
                    )
                ),
            forgetJwt: (applicationId: string) =>
                Effect.sync(() => {
                    jwtByApplicationId.delete(applicationId);
                }),
            withClient: <A, E, R>(applicationId: string, use: (client: EnableBankingClient) => Effect.Effect<A, E, R>) =>
                resolveClient(applicationId).pipe(
                    Effect.flatMap(use),
                    Effect.tapError(error =>
                        Effect.sync(() => {
                            if (error instanceof SyncUnauthorizedError) {
                                jwtByApplicationId.delete(applicationId);
                            }
                        })
                    )
                )
        };
    })
}) {
    static readonly layer = Layer.effect(EnableBankingClientService, EnableBankingClientService.make);
}
