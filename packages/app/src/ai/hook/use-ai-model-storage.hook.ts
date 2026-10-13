import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Equal from 'effect/Equal';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { AI_MODEL_STORAGE_REACTIVITY_KEYS } from '../constant/ai-model-storage-reactivity-keys.constant';
import { chatModelSnapshotAtom, embeddingModelSnapshotAtom, sttSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiModelStorageService } from '../service/ai-model-storage.service';

import type { AiModelStorageSnapshotInterface } from '../interface/ai-model-storage-snapshot.interface';

const EMPTY_AI_MODEL_STORAGE_SNAPSHOT: AiModelStorageSnapshotInterface = {
    entries: [],
    features: [],
    unusedBytes: 0,
    totalBytes: 0
};

const aiModelStatusesAtom = Atom.make(get => [
    get(chatModelSnapshotAtom).status,
    get(embeddingModelSnapshotAtom).status,
    get(sttSnapshotAtom).status
]).pipe(Atom.withEquality(Equal.equals));

const aiModelStorageAtom = appAtomRuntime.factory
    .withReactivity(AI_MODEL_STORAGE_REACTIVITY_KEYS)(
        appAtomRuntime.atom(get => {
            get(aiModelStatusesAtom);

            return Effect.flatMap(AiModelStorageService, aiModelStorageService => aiModelStorageService.list());
        })
    )
    .pipe(Atom.keepAlive);

export const useAiModelStorage = () => {
    const result = useAtomValue(aiModelStorageAtom);
    const refresh = useAtomRefresh(aiModelStorageAtom);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            refresh();
        }
    }, [isFocused, refresh]);

    return {
        snapshot: AsyncResult.getOrElse(result, () => EMPTY_AI_MODEL_STORAGE_SNAPSHOT),
        isLoading: AsyncResult.isInitial(result) || AsyncResult.isWaiting(result),
        errorMessage: AsyncResult.isFailure(result) ? getErrorMessage(Cause.squash(result.cause)) : null
    };
};
