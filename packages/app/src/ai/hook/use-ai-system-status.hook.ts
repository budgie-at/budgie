import { useAtomValue } from '@effect/atom-react/Hooks';

import { AiSystemSnapshotInterface } from '../interface/ai-system-snapshot.interface';
import { aiSystemStatusService } from '../service/ai-system-status.service';

export const useAiSystemStatus = (): AiSystemSnapshotInterface => useAtomValue(aiSystemStatusService.snapshot);
