import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';

export const BankSyncInstallId = Context.Reference<Effect.Effect<string | null>>('@budgie/contracts/BankSyncInstallId', {
    defaultValue: () => Effect.succeed(null)
});
