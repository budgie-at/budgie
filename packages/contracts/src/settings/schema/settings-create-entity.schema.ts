import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';

import { SettingsEntitySchema } from './settings-entity.schema';

export const SettingsCreateEntitySchema = convertToCreateEntitySchema(SettingsEntitySchema)
