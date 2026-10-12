import { Locale } from 'expo-localization';

import { RequiredNonNull } from '../../@generic/type/required-non-null.type';

export type LocaleInfoInterface = Pick<
    RequiredNonNull<Locale>,
    'languageTag' | 'languageCode' | 'decimalSeparator' | 'digitGroupingSeparator'
>;
