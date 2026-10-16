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
    const isAiVoiceInputEnabled = useSetting('isAiVoiceInputEnabled');
    const isAiSuggestionsEnabled = useSetting('isAiSuggestionsEnabled');
    const isAiTranslationsEnabled = useSetting('isAiTranslationsEnabled');

    useEffect(() => {
        appRuntime.runFork(
            Effect.flatMap(AiCoordinatorService, coordinator => coordinator.restart()).pipe(Effect.tapCause(Effect.logError))
        );
    }, [isAiEnabled, isAiVoiceInputEnabled, isAiSuggestionsEnabled, isAiTranslationsEnabled]);

    useEffect(
        () => () => {
            appRuntime.runFork(
                Effect.flatMap(AiCoordinatorService, coordinator => coordinator.stop()).pipe(Effect.tapCause(Effect.logError))
            );
        },
        []
    );

    return children;
};
