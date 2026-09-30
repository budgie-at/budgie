import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { SettingsEntityTable } from '../../schema';
import { SettingsAssociationEnum } from '../enum/settings-association.enum';

import type { SettingsCreateEntityInterface } from '../entity/settings-create-entity.interface';

export class SettingsRepository extends Context.Service<SettingsRepository>()('@budgie/contracts/SettingsRepository', {
    make: Effect.succeed({
        getSettings: Effect.fn('SettingsRepository.getSettings')(function* () {
            const settings = yield* Db.query(db => db.query.SettingsEntityTable.findFirst());

            if (!isDefined(settings)) {
                return yield* Effect.die(new Error('Settings not found'));
            }

            return settings;
        }),
        update: (input: Partial<SettingsCreateEntityInterface>) =>
            Db.query(db => db.update(SettingsEntityTable).set(input).returning()).pipe(Effect.map(([settings]) => settings)),
        findSettings: () =>
            Db.query(db =>
                db.query.SettingsEntityTable.findFirst({
                    with: { [SettingsAssociationEnum.DEFAULT_INSTRUMENT]: true, [SettingsAssociationEnum.DEFAULT_ACCOUNT]: true }
                })
            )
    })
}) {
    static readonly layer = Layer.effect(SettingsRepository, SettingsRepository.make);
}
