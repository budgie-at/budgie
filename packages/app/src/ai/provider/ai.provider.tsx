import * as Effect from 'effect/Effect';
import { ReactNode, useEffect } from 'react';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { AiCoordinatorService } from '../service/ai-coordinator.service';

interface Props {
    readonly children: ReactNode;
}

export const AiProvider = ({ children }: Props) => {
    const isAiEnabled = useSetting('isAiEnabled');

    useEffect(() => {
        if (isAiEnabled) {
            appRuntime.runFork(Effect.flatMap(AiCoordinatorService, aiCoordinatorService => aiCoordinatorService.start()));
        }

        return () => {
            appRuntime.runFork(Effect.flatMap(AiCoordinatorService, aiCoordinatorService => aiCoordinatorService.stop()));
        };
    }, [isAiEnabled]);

    return children;
};
