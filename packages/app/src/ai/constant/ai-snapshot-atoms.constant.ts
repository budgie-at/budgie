import * as Atom from 'effect/reactivity/Atom';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { DrainerStateEnum } from '../enum/drainer-state.enum';

import type { AiCoordinatorSnapshotInterface } from '../interface/ai-coordinator-snapshot.interface';
import type { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';
import type { LlamaSubsystemSnapshotInterface } from '../interface/llama-subsystem-snapshot.interface';
import type { ProgressSnapshotInterface } from '../interface/progress-snapshot.interface';
import type { SttSnapshotInterface } from '../interface/stt-snapshot.interface';

const makeLlamaSnapshotAtom = () =>
    Atom.keepAlive(
        Atom.make<LlamaSubsystemSnapshotInterface>({ status: AiSubsystemStatusEnum.IDLE, downloadProgress: 0, errorMessage: null })
    );

const makeDrainerSnapshotAtom = () =>
    Atom.keepAlive(Atom.make<DrainerSnapshotInterface>({ state: DrainerStateEnum.IDLE, pending: 0, errorMessage: null }));

const makeProgressSnapshotAtom = () => Atom.keepAlive(Atom.make<ProgressSnapshotInterface>({ percent: 0, pending: 0, total: 0 }));

export const chatModelSnapshotAtom = makeLlamaSnapshotAtom();

export const embeddingModelSnapshotAtom = makeLlamaSnapshotAtom();

export const sttSnapshotAtom = Atom.keepAlive(
    Atom.make<SttSnapshotInterface>({
        status: AiSubsystemStatusEnum.IDLE,
        downloadProgress: 0,
        errorMessage: null,
        committedTranscription: '',
        nonCommittedTranscription: ''
    })
);

export const aiCoordinatorSnapshotAtom = Atom.keepAlive(
    Atom.make<AiCoordinatorSnapshotInterface>({ isAvailable: isAiEnabled(), isSuspended: false })
);

export const translationDrainerSnapshotAtom = makeDrainerSnapshotAtom();

export const merchantEmbeddingDrainerSnapshotAtom = makeDrainerSnapshotAtom();

export const commentEmbeddingDrainerSnapshotAtom = makeDrainerSnapshotAtom();

export const translationProgressSnapshotAtom = makeProgressSnapshotAtom();

export const embeddingProgressSnapshotAtom = makeProgressSnapshotAtom();
