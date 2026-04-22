import { DateType } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

export const dateTypeToDate = (value: DateType): Date | null => (isDefined(value) ? new Date(value.toString()) : null);
