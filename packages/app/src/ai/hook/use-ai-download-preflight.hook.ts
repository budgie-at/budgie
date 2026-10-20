import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as Atom from 'effect/reactivity/Atom';
import { Paths } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useNetworkType } from '../../@generic/hook/use-network-type.hook';
import { aiModelDownloadSummaryAtom } from '../constant/ai-model-download-summary-atom.constant';
import { AI_MODEL_FREE_SPACE_RESERVE_BYTES } from '../constant/ai-model-files.constant';

import type { AiDownloadPreflightInterface } from '../interface/ai-download-preflight.interface';

const freeDiskSpaceAtom = Atom.make(context => {
    const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
            context.refreshSelf();
        }
    });

    context.addFinalizer(() => {
        subscription.remove();
    });

    return Paths.availableDiskSpace;
});

export const useAiDownloadPreflight = (): AiDownloadPreflightInterface => {
    const networkType = useNetworkType();
    const freeDiskBytes = useAtomValue(freeDiskSpaceAtom);
    const refreshFreeDiskSpace = useAtomRefresh(freeDiskSpaceAtom);
    const { status, totalBytes, remainingBytes } = useAtomValue(aiModelDownloadSummaryAtom);
    useFocusEffect(refreshFreeDiskSpace);

    const missingBytes = isPositiveNumber(freeDiskBytes)
        ? Math.max(0, remainingBytes + AI_MODEL_FREE_SPACE_RESERVE_BYTES - freeDiskBytes)
        : 0;

    return {
        status,
        totalBytes,
        remainingBytes,
        networkType,
        freeDiskBytes,
        missingBytes,
        hasEnoughSpace: !isPositiveNumber(missingBytes)
    };
};
