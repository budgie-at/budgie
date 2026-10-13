import { MonobankSyncService } from '@budgie/sync';

import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { defineSyncTask } from '../utils/define-sync-task.util';

defineSyncTask(MONOBANK_SYNC_TASK, MonobankSyncService);
