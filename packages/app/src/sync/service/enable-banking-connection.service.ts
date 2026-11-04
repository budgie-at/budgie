import { BankIntegrationRepository } from '@budgie/contracts';
import {
    EnableBankingCallbackError,
    EnableBankingCallbackFailureEnum,
    EnableBankingSyncService,
    EnableBankingTokenSchema
} from '@budgie/sync';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Linking } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ENABLE_BANKING_CALLBACK_URL } from '../constant/enable-banking-callback-url.constant';
import { ENABLE_BANKING_RELAY_URL } from '../constant/enable-banking-relay-url.constant';
import { EnableBankingSetupErrorReasonEnum } from '../enum/enable-banking-setup-error-reason.enum';
import { EnableBankingSetupError } from '../error/enable-banking-setup.error';
import { parseEnableBankingApplicationId } from '../utils/parse-enable-banking-application-id.util';
import { parseEnableBankingPem } from '../utils/parse-enable-banking-pem.util';

import { EnableBankingSecureStore } from './enable-banking-secure-store.service';

import type { EnableBankingBankInterface } from '@budgie/sync';

export class EnableBankingConnectionService extends Context.Service<EnableBankingConnectionService>()(
    '@budgie/app/EnableBankingConnectionService',
    {
        make: Effect.gen(function* () {
            const secureStore = yield* EnableBankingSecureStore;
            const enableBankingSyncService = yield* EnableBankingSyncService;
            const bankIntegrationRepository = yield* BankIntegrationRepository;
            const decodeToken = Schema.decodeUnknownEffect(Schema.fromJsonString(EnableBankingTokenSchema));

            const fail = (reason: EnableBankingSetupErrorReasonEnum) => new EnableBankingSetupError({ reason });

            const begin = Effect.fn('EnableBankingConnectionService.begin')(function* (
                applicationId: string,
                bank: Pick<EnableBankingBankInterface, 'name' | 'country' | 'maximumConsentValiditySeconds'>,
                integrationId: number | null
            ) {
                const { url, pending } = yield* enableBankingSyncService.startAuthorization({
                    applicationId,
                    aspspName: bank.name,
                    aspspCountry: bank.country,
                    integrationId,
                    callbackUrl: ENABLE_BANKING_CALLBACK_URL,
                    redirectUrl: ENABLE_BANKING_RELAY_URL,
                    maximumConsentValiditySeconds: bank.maximumConsentValiditySeconds
                });
                yield* secureStore.savePending(pending);
                yield* Effect.tryPromise({
                    try: () => Linking.openURL(url),
                    catch: () => fail(EnableBankingSetupErrorReasonEnum.BROWSER_UNAVAILABLE)
                });
            });

            return {
                begin,
                discardPending: () => secureStore.removePending(),
                pickKeyFile: Effect.fn('EnableBankingConnectionService.pickKeyFile')(function* () {
                    return yield* Effect.acquireUseRelease(
                        Effect.tryPromise({
                            try: () => DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true }),
                            catch: () => fail(EnableBankingSetupErrorReasonEnum.UNREADABLE_FILE)
                        }),
                        result => {
                            const asset = result.assets?.at(0);
                            if (result.canceled || !isDefined(asset)) {
                                return Effect.succeed(null);
                            }

                            return Effect.tryPromise({
                                try: () => new File(asset.uri).text(),
                                catch: () => fail(EnableBankingSetupErrorReasonEnum.UNREADABLE_FILE)
                            }).pipe(
                                Effect.flatMap(parseEnableBankingPem),
                                Effect.map(pem => ({ pem, applicationId: parseEnableBankingApplicationId(asset.name) }))
                            );
                        },
                        result =>
                            Effect.ignore(
                                Effect.try(() => {
                                    for (const asset of result.assets ?? []) {
                                        new File(asset.uri).delete();
                                    }
                                })
                            )
                    );
                }),
                saveKey: Effect.fn('EnableBankingConnectionService.saveKey')(function* (applicationId: string, pem: string) {
                    const previousPem = yield* secureStore.readKey(applicationId);
                    const restorePrevious = Effect.ignore(
                        (isDefined(previousPem)
                            ? secureStore.saveKey(applicationId, previousPem)
                            : secureStore.removeKey(applicationId)
                        ).pipe(Effect.andThen(enableBankingSyncService.forgetCredentials(applicationId)))
                    );

                    yield* Effect.gen(function* () {
                        yield* secureStore.saveKey(applicationId, pem);
                        const application = yield* enableBankingSyncService.validateCredentials(applicationId);
                        if (!application.isActive) {
                            return yield* fail(EnableBankingSetupErrorReasonEnum.INACTIVE_APPLICATION);
                        }
                        if (!application.redirectUrls.includes(ENABLE_BANKING_RELAY_URL)) {
                            return yield* fail(EnableBankingSetupErrorReasonEnum.REDIRECT_URL_MISSING);
                        }
                    }).pipe(Effect.onExit(exit => (Exit.isSuccess(exit) ? Effect.void : restorePrevious)));
                }),
                discardUnusedKey: Effect.fn('EnableBankingConnectionService.discardUnusedKey')(function* (applicationId: string) {
                    const pending = yield* secureStore.readPending();
                    if (pending?.applicationId === applicationId || (yield* enableBankingSyncService.isApplicationInUse(applicationId))) {
                        return;
                    }

                    yield* secureStore.removeKey(applicationId);
                    yield* enableBankingSyncService.forgetCredentials(applicationId);
                }),
                reauthorize: Effect.fn('EnableBankingConnectionService.reauthorize')(function* (integrationId: number) {
                    const integration = yield* bankIntegrationRepository.findById(integrationId);
                    if (!isDefined(integration)) {
                        return yield* Effect.die(new Error('Bank integration not found'));
                    }

                    const credentials = yield* decodeToken(integration.token).pipe(Effect.orDie);
                    const banks = yield* enableBankingSyncService.listBanks(credentials.applicationId, credentials.aspspCountry);
                    const bank = banks.find(candidate => candidate.name === credentials.aspspName);
                    if (!isDefined(bank)) {
                        return yield* Effect.die(new Error('Bank is no longer offered'));
                    }

                    yield* begin(credentials.applicationId, bank, integrationId);
                }),
                finish: Effect.fn('EnableBankingConnectionService.finish')(function* (callbackUrl: string) {
                    const pending = yield* secureStore.readPending();
                    if (!isDefined(pending)) {
                        return yield* new EnableBankingCallbackError({ failure: EnableBankingCallbackFailureEnum.STATE_MISMATCH });
                    }

                    yield* enableBankingSyncService
                        .resolveCallbackCode(pending, callbackUrl)
                        .pipe(
                            Effect.tapError(error =>
                                error.failure === EnableBankingCallbackFailureEnum.EXPIRED ||
                                error.failure === EnableBankingCallbackFailureEnum.CANCELLED
                                    ? secureStore.removePending()
                                    : Effect.void
                            )
                        );
                    yield* secureStore.removePending();

                    return yield* enableBankingSyncService.completeAuthorization(pending, callbackUrl);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(EnableBankingConnectionService, EnableBankingConnectionService.make).pipe(
        Layer.provide([EnableBankingSecureStore.layer, BankIntegrationRepository.layer]),
        Layer.provideMerge(EnableBankingSyncService.layer)
    );
}
