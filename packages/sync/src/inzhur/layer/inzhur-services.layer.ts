import * as Layer from 'effect/Layer';

import { InzhurBankFlowService } from '../service/inzhur-bank-flow.service';
import { InzhurImportService } from '../service/inzhur-import.service';
import { InzhurSetupService } from '../service/inzhur-setup.service';

export const inzhurServicesLayer = Layer.mergeAll(InzhurSetupService.layer, InzhurImportService.layer, InzhurBankFlowService.layer);
