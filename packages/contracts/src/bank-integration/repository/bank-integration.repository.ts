import { and, count, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { Db } from '../../@generic/service/db.service';
import { BankIntegrationEntityTable } from '../table/bank-integration-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import type { BankIntegrationCreateEntityInterface } from '../entity/bank-integration-create-entity.interface';
import type { BankIntegrationUpdateEntityInterface } from '../entity/bank-integration-update-entity.interface';

export class BankIntegrationRepository {
    readonly create = Effect.fn('BankIntegrationRepository.create')(function* (input: BankIntegrationCreateEntityInterface) {
        const [bankIntegration] = yield* Db.query(db => db.insert(BankIntegrationEntityTable).values([input]).returning());

        return bankIntegration;
    });

    readonly findByProviderAndToken = Effect.fn('BankIntegrationRepository.findByProviderAndToken')(function* (
        provider: ExternalSourceEnum,
        token: string
    ) {
        return yield* Db.query(db =>
            db.query.BankIntegrationEntityTable.findFirst({
                where: and(
                    eq(BankIntegrationEntityTable.provider, provider),
                    eq(BankIntegrationEntityTable.token, token),
                    isNull(BankIntegrationEntityTable.deletedAt)
                )
            })
        );
    });

    readonly updateById = Effect.fn('BankIntegrationRepository.updateById')(function* (
        id: number,
        input: BankIntegrationUpdateEntityInterface
    ) {
        const bankIntegrations = yield* Db.query(db =>
            db
                .update(BankIntegrationEntityTable)
                .set({ ...input, updatedAt: new Date() })
                .where(and(eq(BankIntegrationEntityTable.id, id), isNull(BankIntegrationEntityTable.deletedAt)))
                .returning()
        );

        return bankIntegrations.at(0);
    });

    readonly findFileImportIntegration = Effect.fn('BankIntegrationRepository.findFileImportIntegration')(function* (
        this: BankIntegrationRepository,
        provider: ExternalSourceEnum
    ) {
        return yield* this.findByProviderAndToken(provider, '');
    });

    constructor(private db: DB) {}

    findById(id: number) {
        return this.db.query.BankIntegrationEntityTable.findFirst({
            where: and(eq(BankIntegrationEntityTable.id, id), isNull(BankIntegrationEntityTable.deletedAt))
        });
    }

    count() {
        return this.db.select({ count: count() }).from(BankIntegrationEntityTable).where(isNull(BankIntegrationEntityTable.deletedAt));
    }
}
