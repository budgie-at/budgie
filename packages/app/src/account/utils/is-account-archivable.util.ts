import { HouseholdShareStateEnum } from '@budgie/cloud-sync';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import type { HouseholdShareStatusInterface } from '@budgie/cloud-sync';

export const isAccountArchivable = <E>(result: AsyncResult.AsyncResult<Pick<HouseholdShareStatusInterface, 'state'>, E>): boolean =>
    !AsyncResult.isInitial(result) && AsyncResult.getOrElse(result, () => null)?.state !== HouseholdShareStateEnum.SHARED_BY_OTHER;
