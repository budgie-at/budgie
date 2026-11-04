import { AccountEntityTable, Db, SyncEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const integrationSyncsAtom = Atom.family((integrationId: number) =>
    databaseQueryAtom(
        [AccountEntityTable, SyncEntityTable],
        Db.query(db =>
            db.query.AccountEntityTable.findMany({
                where: { integrationId, deletedAt: { isNull: true } },
                with: { sync: { where: { deletedAt: { isNull: true } } } }
            })
        )
    )
);

export const useBankIntegrationSyncsQuery = (integrationId: number) =>
    AsyncResult.getOrElse(useLiveAtomValue(integrationSyncsAtom(integrationId)), () => [])
        .map(account => account.sync)
        .filter(isDefined);
