import { AccountRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { WalletCaptureNativeService } from './wallet-capture-native.service';

export class WalletCaptureAccountMirrorService extends Context.Service<WalletCaptureAccountMirrorService>()(
    '@budgie/app/WalletCaptureAccountMirrorService',
    {
        make: Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const nativeService = yield* WalletCaptureNativeService;

            return {
                refresh: Effect.fn('WalletCaptureAccountMirrorService.refresh')(function* () {
                    yield* nativeService.replaceAccounts(
                        (yield* accountRepository.getAllActiveAccounts())
                            .filter(account => account.isActive)
                            .map(({ id, title }) => ({ id, title }))
                    );
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(WalletCaptureAccountMirrorService, WalletCaptureAccountMirrorService.make).pipe(
        Layer.provide([AccountRepository.layer, WalletCaptureNativeService.layer])
    );
}
