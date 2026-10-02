import { useAtomValue } from '@effect/atom-react/Hooks';

import { aiSystemStatusAtom } from '../constant/ai-system-status-atom.constant';
import { AiSystemSnapshotInterface } from '../interface/ai-system-snapshot.interface';

export const useAiSystemStatus = (): AiSystemSnapshotInterface => useAtomValue(aiSystemStatusAtom);
