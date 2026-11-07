import { InzhurSetupService } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

export const requireInzhurSetup = Effect.fnUntraced(function* () {
    const inzhurSetupService = yield* InzhurSetupService;
    const setup = yield* inzhurSetupService.findSetup();

    if (!isDefined(setup)) {
        return yield* Effect.die(new Error('Inzhur is not set up'));
    }

    return setup;
});
