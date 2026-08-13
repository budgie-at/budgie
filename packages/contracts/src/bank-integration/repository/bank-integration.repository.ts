import { Log } from '@budgie/logger';
import { and, eq, isNull } from 'drizzle-orm';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { BankIntegrationEntityTable } from '../table/bank-integration-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import type { BankIntegrationCreateEntityInterface } from '../entity/bank-integration-create-entity.interface';
import type { BankIntegrationEntityInterface } from '../entity/bank-integration-entity.interface';
import type { BankIntegrationUpdateEntityInterface } from '../entity/bank-integration-update-entity.interface';

export class BankIntegrationRepository {
    constructor(private db: DB) {}

    @Log(
        (input, tx) => `enter provider=${input.provider} tokenLen=${input.token.length} hasTx=${String(isDefined(tx))}`,
        (result, input, tx) =>
            `done provider=${input.provider} tokenLen=${input.token.length} hasTx=${String(isDefined(tx))} id=${result.id}`,
        (error, input, tx) =>
            `throw provider=${input.provider} tokenLen=${input.token.length} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async create(input: BankIntegrationCreateEntityInterface, tx?: DB): Promise<BankIntegrationEntityInterface> {
        const [bankIntegration] = await (tx ?? this.db).insert(BankIntegrationEntityTable).values([input]).returning();

        return bankIntegration;
    }

    @Log(
        (provider, token, tx) => `enter provider=${provider} tokenLen=${token.length} hasTx=${String(isDefined(tx))}`,
        (result, provider, token, tx) =>
            `done provider=${provider} tokenLen=${token.length} hasTx=${String(isDefined(tx))} found=${String(isDefined(result))}`,
        (error, provider, token, tx) =>
            `throw provider=${provider} tokenLen=${token.length} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async findByProviderAndToken(
        provider: ExternalSourceEnum,
        token: string,
        tx?: DB
    ): Promise<BankIntegrationEntityInterface | undefined> {
        return await (tx ?? this.db).query.BankIntegrationEntityTable.findFirst({
            where: and(
                eq(BankIntegrationEntityTable.provider, provider),
                eq(BankIntegrationEntityTable.token, token),
                isNull(BankIntegrationEntityTable.deletedAt)
            )
        });
    }

    @Log(
        (id, input, tx) =>
            `enter id=${id} provider=${input.provider ?? 'unchanged'} tokenLen=${input.token?.length ?? 0} hasTx=${String(isDefined(tx))}`,
        (result, id, input, tx) =>
            `done id=${id} provider=${input.provider ?? 'unchanged'} tokenLen=${input.token?.length ?? 0} hasTx=${String(isDefined(tx))} found=${String(isDefined(result))}`,
        (error, id, input, tx) =>
            `throw id=${id} provider=${input.provider ?? 'unchanged'} tokenLen=${input.token?.length ?? 0} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async updateById(
        id: number,
        input: BankIntegrationUpdateEntityInterface,
        tx?: DB
    ): Promise<BankIntegrationEntityInterface | undefined> {
        const [bankIntegration] = await (tx ?? this.db)
            .update(BankIntegrationEntityTable)
            .set({ ...input, updatedAt: new Date() })
            .where(and(eq(BankIntegrationEntityTable.id, id), isNull(BankIntegrationEntityTable.deletedAt)))
            .returning();

        return bankIntegration;
    }

    @Log(
        (provider, tx) => `enter provider=${provider} hasTx=${String(isDefined(tx))}`,
        (result, provider, tx) => `done provider=${provider} hasTx=${String(isDefined(tx))} found=${String(isDefined(result))}`,
        (error, provider, tx) => `throw provider=${provider} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async findFileImportIntegration(provider: ExternalSourceEnum, tx?: DB): Promise<BankIntegrationEntityInterface | undefined> {
        return this.findByProviderAndToken(provider, '', tx);
    }

    findById(id: number, tx?: DB) {
        return (tx ?? this.db).query.BankIntegrationEntityTable.findFirst({
            where: and(eq(BankIntegrationEntityTable.id, id), isNull(BankIntegrationEntityTable.deletedAt))
        });
    }
}
