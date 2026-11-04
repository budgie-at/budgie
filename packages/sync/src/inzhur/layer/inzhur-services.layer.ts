import * as Layer from 'effect/Layer';

import { InzhurImportService } from '../service/inzhur-import.service';
import { InzhurSetupService } from '../service/inzhur-setup.service';

export const inzhurServicesLayer = Layer.mergeAll(InzhurSetupService.layer, InzhurImportService.layer);
