import * as Layer from 'effect/Layer';

import { emptyFn } from '@rnw-community/shared';

import { makeCountingService } from './counting-service';

export const tagModule = (
    name: string,
    shape: object = {}
): { readonly layer: Layer.Layer<never>; readonly invokerLayer: Layer.Layer<never> } =>
    Object.assign(makeCountingService(`test/${name}`, shape, emptyFn), { invokerLayer: Layer.empty });
