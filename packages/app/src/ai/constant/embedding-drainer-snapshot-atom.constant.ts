import * as Atom from 'effect/reactivity/Atom';

import { DrainerStateEnum } from '../enum/drainer-state.enum';

import { commentEmbeddingDrainerSnapshotAtom, merchantEmbeddingDrainerSnapshotAtom } from './ai-snapshot-atoms.constant';

import type { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';

const deriveState = (merchantState: DrainerStateEnum, commentState: DrainerStateEnum): DrainerStateEnum => {
    if (merchantState === DrainerStateEnum.ERROR || commentState === DrainerStateEnum.ERROR) {
        return DrainerStateEnum.ERROR;
    }
    if (merchantState === DrainerStateEnum.BOOSTING || commentState === DrainerStateEnum.BOOSTING) {
        return DrainerStateEnum.BOOSTING;
    }
    if (merchantState === DrainerStateEnum.PAUSED && commentState === DrainerStateEnum.PAUSED) {
        return DrainerStateEnum.PAUSED;
    }

    return DrainerStateEnum.IDLE;
};

export const embeddingDrainerSnapshotAtom = Atom.make((get): DrainerSnapshotInterface => {
    const merchant = get(merchantEmbeddingDrainerSnapshotAtom);
    const comment = get(commentEmbeddingDrainerSnapshotAtom);

    return {
        state: deriveState(merchant.state, comment.state),
        pending: merchant.pending + comment.pending,
        errorMessage: merchant.errorMessage ?? comment.errorMessage
    };
});
