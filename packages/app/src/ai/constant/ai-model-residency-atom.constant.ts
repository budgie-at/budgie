import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { AiModelResidencyService } from '../service/ai-model-residency.service';

import type { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';

export const aiModelResidencyAtom = Atom.family((subsystem: AiSubsystemNameEnum | null) =>
    Atom.make(context => {
        if (!isDefined(subsystem)) {
            return null;
        }

        appRuntime.runFork(Effect.flatMap(AiModelResidencyService, aiModelResidencyService => aiModelResidencyService.acquire(subsystem)));

        context.addFinalizer(() => {
            appRuntime.runFork(
                Effect.flatMap(AiModelResidencyService, aiModelResidencyService => aiModelResidencyService.release(subsystem))
            );
        });

        return null;
    })
);
