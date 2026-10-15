import { SettingsEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { AiModelStorageService } from '../service/ai-model-storage.service';

export const aiModelStorageAtom = databaseQueryAtom(
    [SettingsEntityTable],
    Effect.flatMap(AiModelStorageService, aiModelStorageService => aiModelStorageService.getUsage())
);
