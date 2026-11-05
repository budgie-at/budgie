import { EnableBankingSyncService } from '@budgie/sync';

import { ENABLE_BANKING_SYNC_TASK } from '../constant/enable-banking-sync-task.constant';
import { defineSyncTask } from '../utils/define-sync-task.util';

defineSyncTask(ENABLE_BANKING_SYNC_TASK, EnableBankingSyncService);
