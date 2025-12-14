import { DatePeriodEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const DATE_PERIOD: Record<DatePeriodEnum, MessageDescriptor> = {
    [DatePeriodEnum.ALL_TIME]: msg`All Time`,
    [DatePeriodEnum.TODAY]: msg`Today`,
    [DatePeriodEnum.THIS_WEEK]: msg`This Week`,
    [DatePeriodEnum.THIS_MONTH]: msg`This Month`,
    [DatePeriodEnum.THIS_YEAR]: msg`This Year`
};
