import { InzhurImportService } from '@budgie/sync';
import * as Effect from 'effect/Effect';

export const importInzhurStatement = (uri: string) => Effect.flatMap(InzhurImportService, service => service.importStatement(uri));
