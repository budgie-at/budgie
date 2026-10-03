import { ImporterColumnMapInterface } from '../interface/importer-column-map.interface';

export type NormalizedRowType = Record<keyof ImporterColumnMapInterface, string>;
