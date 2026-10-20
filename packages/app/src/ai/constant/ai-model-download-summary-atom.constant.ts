import * as Equal from 'effect/Equal';
import * as Atom from 'effect/reactivity/Atom';

import { isPositiveNumber } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { settingsContextAtom } from '../../settings/constants/settings-context-atom.constant';
import { AiModelDownloadStatusEnum } from '../enum/ai-model-download-status.enum';
import { AiModelDownloadSummaryInterface } from '../interface/ai-model-download-summary.interface';
import { getEnabledAiSubsystems } from '../utils/get-enabled-ai-subsystems.util';
import { sumAiModelDownloadBytes } from '../utils/sum-ai-model-download-bytes.util';

import { AI_MODEL_DOWNLOAD_ORDER } from './ai-model-files.constant';
import { aiModelDownloadSnapshotAtom } from './ai-snapshot-atoms.constant';

const FULL_PERCENT = 100;

const deriveSummary = (get: Atom.AtomContext): AiModelDownloadSummaryInterface => {
    const snapshot = get(aiModelDownloadSnapshotAtom);
    const { settings } = get(settingsContextAtom);
    const isEnabled = isAiEnabled() && settings.isAiEnabled;
    const enabled = getEnabledAiSubsystems(settings);
    const { downloadedBytes, totalBytes, ratio } = sumAiModelDownloadBytes(
        (isEnabled ? AI_MODEL_DOWNLOAD_ORDER.filter(name => enabled.has(name)) : AI_MODEL_DOWNLOAD_ORDER).map(name => snapshot.models[name])
    );
    const remainingBytes = Math.max(0, totalBytes - downloadedBytes);
    const isDownloading = snapshot.status === AiModelDownloadStatusEnum.DOWNLOADING;

    return {
        status: isEnabled ? snapshot.status : AiModelDownloadStatusEnum.DISABLED,
        downloadedBytes,
        totalBytes,
        remainingBytes,
        percent: Math.floor(ratio * FULL_PERCENT),
        etaSeconds: isDownloading && isPositiveNumber(snapshot.bytesPerSecond) ? Math.ceil(remainingBytes / snapshot.bytesPerSecond) : null,
        missingBytes: snapshot.missingBytes,
        freeBytes: snapshot.freeBytes,
        isMobileDataAllowed: snapshot.isMobileDataAllowed,
        isNoticeDismissed: snapshot.isNoticeDismissed
    };
};

export const aiModelDownloadSummaryAtom = Atom.make(deriveSummary).pipe(Atom.withEquality(Equal.equals));
