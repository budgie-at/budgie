import { useSyncExternalStore } from 'react';

import { AiSystemUmbrellaSnapshotInterface } from '../interface/ai-system-umbrella-snapshot.interface';
import { aiUmbrellaStatusService } from '../service/ai-umbrella-status.service';

export const useAiSystemUmbrella = (): AiSystemUmbrellaSnapshotInterface =>
    useSyncExternalStore(aiUmbrellaStatusService.subscribe, aiUmbrellaStatusService.getSnapshot);
