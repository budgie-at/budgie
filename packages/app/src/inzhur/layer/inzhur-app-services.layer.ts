import { InvestmentReturnRepository } from '@budgie/contracts';
import { InzhurImportService, InzhurSetupService } from '@budgie/sync';
import * as Layer from 'effect/Layer';

import { InzhurStatementReminderService } from '../service/inzhur-statement-reminder.service';

export const inzhurAppServicesLayer = Layer.mergeAll(
    InvestmentReturnRepository.layer,
    InzhurSetupService.layer,
    InzhurImportService.layer,
    InzhurStatementReminderService.layer
);
