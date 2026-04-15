import { ImporterColumnMapInterface } from '../interface/importer-column-map-interface.type';

export type NormalizedRowType = Record<keyof ImporterColumnMapInterface, string>;
