import { SyncReferenceKindEnum } from '../enum/sync-reference-kind.enum';

const LOCAL_ID_SUFFIX = /Id$/u;

export const deriveSyncReferenceField = (property: string, kind: SyncReferenceKindEnum): string =>
    `${property.replace(LOCAL_ID_SUFFIX, '')}${kind === SyncReferenceKindEnum.SYNC_ID ? 'SyncId' : 'Code'}`;
