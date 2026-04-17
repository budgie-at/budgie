import { useSyncExternalStore } from 'react';

import { SttSnapshotInterface } from '../interface/stt-snapshot.interface';
import { sttService } from '../service/stt.service';

export const useSttSnapshot = (): SttSnapshotInterface =>
    useSyncExternalStore(sttService.subscribe, sttService.getSnapshot);
