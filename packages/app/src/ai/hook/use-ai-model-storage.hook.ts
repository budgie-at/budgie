import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { appAtomRuntime, appRuntime } from '../../@generic/runtime/app.runtime';
import { chatModelSnapshotAtom, embeddingModelSnapshotAtom, sttSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiModelStorageIdEnum } from '../enum/ai-model-storage-id.enum';
import { AiModelStorageService } from '../service/ai-model-storage.service';

import type { AiModelStorageSnapshotInterface } from '../interface/ai-model-storage-snapshot.interface';
import type { UseAiModelStorageReturnInterface } from '../interface/use-ai-model-storage-return.interface';

const EMPTY_AI_MODEL_STORAGE_SNAPSHOT: AiModelStorageSnapshotInterface = {
    entries: [],
    totalBytes: 0
};

const aiModelStorageAtom = appAtomRuntime
    .atom(Effect.flatMap(AiModelStorageService, aiModelStorageService => aiModelStorageService.list()))
    .pipe(Atom.keepAlive);

export const useAiModelStorage = (): UseAiModelStorageReturnInterface => {
    const result = useAtomValue(aiModelStorageAtom);
    const refresh = useAtomRefresh(aiModelStorageAtom);
    const isFocused = useIsFocused();
    const chatModelStatus = useAtomValue(chatModelSnapshotAtom, snapshot => snapshot.status);
    const embeddingModelStatus = useAtomValue(embeddingModelSnapshotAtom, snapshot => snapshot.status);
    const sttStatus = useAtomValue(sttSnapshotAtom, snapshot => snapshot.status);
    const [removingId, setRemovingId] = useState<AiModelStorageIdEnum | null>(null);
    const [isRemovingAll, setIsRemovingAll] = useState(false);
    const snapshot = AsyncResult.getOrElse(result, () => EMPTY_AI_MODEL_STORAGE_SNAPSHOT);
    const isLoading = AsyncResult.isInitial(result) || AsyncResult.isWaiting(result);
    const errorMessage = AsyncResult.isFailure(result) ? getErrorMessage(Cause.squash(result.cause)) : null;

    useEffect(() => {
        if (isFocused) {
            refresh();
        }
    }, [chatModelStatus, embeddingModelStatus, isFocused, refresh, sttStatus]);

    const remove = (id: AiModelStorageIdEnum) => {
        setRemovingId(id);

        return appRuntime
            .runPromise(AiModelStorageService.pipe(Effect.flatMap(aiModelStorageService => aiModelStorageService.remove(id))))
            .finally(() => {
                refresh();
                setRemovingId(null);
            });
    };

    const removeAll = () => {
        setIsRemovingAll(true);

        return appRuntime
            .runPromise(AiModelStorageService.pipe(Effect.flatMap(aiModelStorageService => aiModelStorageService.removeAll())))
            .finally(() => {
                refresh();
                setIsRemovingAll(false);
            });
    };

    return { snapshot, isLoading, removingId, isRemovingAll, errorMessage, refresh, remove, removeAll };
};
