import { DateFilterActionTypeEnum } from '../enum/date-filter-action-type.enum';

import type { DateRangeInterface } from '@budgie/contracts';

export interface DateFilterActionInterface {
    readonly type: DateFilterActionTypeEnum;
    readonly range: DateRangeInterface;
}
