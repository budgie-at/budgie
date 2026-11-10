import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export const makeCountingService = (key: string, shape: object, onBuild: () => void): { readonly layer: Layer.Layer<never> } => {
    class CountingService extends Context.Service<CountingService, object>()(key) {
        static readonly layer = Layer.effect(
            CountingService,
            Effect.sync(() => {
                onBuild();

                return shape;
            })
        );
    }

    return CountingService;
};
