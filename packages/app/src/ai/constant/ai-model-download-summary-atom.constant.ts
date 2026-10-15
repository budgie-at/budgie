import * as Equal from 'effect/Equal';
import * as Atom from 'effect/reactivity/Atom';

import { isPositiveNumber } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { settingsContextAtom } from '../../settings/constants/settings-context-atom.constant';
import { AiModelDownloadStatusEnum } from '../enum/ai-model-download-status.enum';
import { AiModelDownloadSummaryInterface } from '../interface/ai-model-download-summary.interface';
import { sumAiModelDownloadBytes } from '../utils/sum-ai-model-download-bytes.util';

import { aiModelDownloadSnapshotAtom } from './ai-snapshot-atoms.constant';

const FULL_PERCENT = 100;

const deriveSummary = (get: Atom.AtomContext): AiModelDownloadSummaryInterface => {
    const snapshot = get(aiModelDownloadSnapshotAtom);
    const isEnabled = isAiEnabled() && get(settingsContextAtom).settings.isAiEnabled;
    const { downloadedBytes, totalBytes } = sumAiModelDownloadBytes(Object.values(snapshot.models));
    const remainingBytes = Math.max(0, totalBytes - downloadedBytes);
    const isDownloading = snapshot.status === AiModelDownloadStatusEnum.DOWNLOADING;

    return {
        status: isEnabled ? snapshot.status : AiModelDownloadStatusEnum.DISABLED,
        downloadedBytes,
        totalBytes,
        remainingBytes,
        percent: isPositiveNumber(totalBytes) ? Math.floor((downloadedBytes / totalBytes) * FULL_PERCENT) : 0,
        etaSeconds: isDownloading && isPositiveNumber(snapshot.bytesPerSecond) ? Math.ceil(remainingBytes / snapshot.bytesPerSecond) : null,
        missingBytes: snapshot.missingBytes,
        freeBytes: snapshot.freeBytes,
        isMobileDataAllowed: snapshot.isMobileDataAllowed,
        isNoticeDismissed: snapshot.isNoticeDismissed
    };
};

export const aiModelDownloadSummaryAtom = Atom.make(deriveSummary).pipe(Atom.withEquality(Equal.equals));
