import { and, count, eq, isNull } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { BankIntegrationEntityTable } from '../table/bank-integration-entity.table';

import type { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import type { BankIntegrationCreateEntityInterface } from '../entity/bank-integration-create-entity.interface';
import type { BankIntegrationUpdateEntityInterface } from '../entity/bank-integration-update-entity.interface';

export class BankIntegrationRepository extends Context.Service<BankIntegrationRepository>()('@budgie/contracts/BankIntegrationRepository', {
    make: Effect.sync(() => {
        const findByProviderAndToken = (provider: ExternalSourceEnum, token: string) =>
            Db.query(db =>
                db.query.BankIntegrationEntityTable.findFirst({
                    where: and(
                        eq(BankIntegrationEntityTable.provider, provider),
                        eq(BankIntegrationEntityTable.token, token),
                        isNull(BankIntegrationEntityTable.deletedAt)
                    )
                })
            );

        return {
            findByProviderAndToken,
            findFileImportIntegration: (provider: ExternalSourceEnum) => findByProviderAndToken(provider, ''),
            create: (input: BankIntegrationCreateEntityInterface) =>
                Db.query(db => db.insert(BankIntegrationEntityTable).values([input]).returning()).pipe(
                    Effect.map(([bankIntegration]) => bankIntegration)
                ),
            updateById: (id: number, input: BankIntegrationUpdateEntityInterface) =>
                Db.query(db =>
                    db
                        .update(BankIntegrationEntityTable)
                        .set({ ...input, updatedAt: new Date() })
                        .where(and(eq(BankIntegrationEntityTable.id, id), isNull(BankIntegrationEntityTable.deletedAt)))
                        .returning()
                ).pipe(Effect.map(bankIntegrations => bankIntegrations.at(0))),
            findById: (id: number) =>
                Db.query(db =>
                    db.query.BankIntegrationEntityTable.findFirst({
                        where: and(eq(BankIntegrationEntityTable.id, id), isNull(BankIntegrationEntityTable.deletedAt))
                    })
                ),
            count: () =>
                Db.query(db =>
                    db.select({ count: count() }).from(BankIntegrationEntityTable).where(isNull(BankIntegrationEntityTable.deletedAt))
                )
        };
    })
}) {
    static readonly layer = Layer.effect(BankIntegrationRepository, BankIntegrationRepository.make);
}
