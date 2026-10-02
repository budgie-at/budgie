import * as Effect from 'effect/Effect';

import { makeConsolidationFamilyStrategy } from './make-consolidation-family-strategy.util';

import type { ConsolidationFamilyDefinitionInterface } from '../interface/consolidation-family-definition.interface';
import type * as Context from 'effect/Context';

export const makeConsolidationFamilyService = <RepositoryIdentifier, Repository, ExecutorIdentifier, Executor, Candidate>(
    repositoryKey: Context.Key<RepositoryIdentifier, Repository>,
    executorKey: Context.Key<ExecutorIdentifier, Executor>,
    define: (repository: Repository, executor: Executor) => ConsolidationFamilyDefinitionInterface<Candidate>
) =>
    Effect.gen(function* () {
        const repository = yield* repositoryKey;
        const executor = yield* executorKey;

        return makeConsolidationFamilyStrategy(define(repository, executor));
    });
