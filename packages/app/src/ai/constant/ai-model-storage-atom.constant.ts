import { SettingsEntityTable } from '@budgie/contracts';
import { getTableName } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { AiModelStorageService } from '../service/ai-model-storage.service';

import { chatModelSnapshotAtom, embeddingModelSnapshotAtom, sttSnapshotAtom } from './ai-snapshot-atoms.constant';

const modelStatuses = [chatModelSnapshotAtom, embeddingModelSnapshotAtom, sttSnapshotAtom].map(snapshot =>
    Atom.map(snapshot, value => value.status)
);

export const aiModelStorageAtom = appAtomRuntime.factory.withReactivity([getTableName(SettingsEntityTable)])(
    appAtomRuntime.atom(get => {
        modelStatuses.forEach(status => get(status));

        return Effect.flatMap(AiModelStorageService, aiModelStorageService => aiModelStorageService.getUsage());
    })
);
