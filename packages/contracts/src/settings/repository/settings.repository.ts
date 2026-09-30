import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { SettingsEntityTable } from '../../schema';
import { SettingsAssociationEnum } from '../enum/settings-association.enum';

import type * as schema from '../../schema';
import type { SettingsCreateEntityInterface } from '../entity/settings-create-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class SettingsRepository {
    readonly getSettings = Effect.fn('SettingsRepository.getSettings')(function* () {
        const settings = yield* Db.query(db => db.query.SettingsEntityTable.findFirst());

        if (!isDefined(settings)) {
            return yield* Effect.die(new Error('Settings not found'));
        }

        return settings;
    });

    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    readonly update = (input: Partial<SettingsCreateEntityInterface>) =>
        Db.query(db => db.update(SettingsEntityTable).set(input).returning()).pipe(Effect.map(([settings]) => settings));

    findSettings() {
        return this.db.query.SettingsEntityTable.findFirst({
            with: { [SettingsAssociationEnum.DEFAULT_INSTRUMENT]: true, [SettingsAssociationEnum.DEFAULT_ACCOUNT]: true }
        });
    }
}
