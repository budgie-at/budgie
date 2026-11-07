import { InzhurOperationsImportService } from '@budgie/sync';
import * as Effect from 'effect/Effect';

export const importInzhurOperations = (uri: string) =>
    Effect.flatMap(InzhurOperationsImportService, service => service.importOperations(uri));
