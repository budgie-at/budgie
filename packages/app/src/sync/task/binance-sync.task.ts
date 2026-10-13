import { BinanceSyncService } from '@budgie/sync';

import { BINANCE_SYNC_TASK } from '../constant/binance-sync-task.constant';
import { defineSyncTask } from '../utils/define-sync-task.util';

defineSyncTask(BINANCE_SYNC_TASK, BinanceSyncService);
