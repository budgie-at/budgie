import { useAtomValue } from '@effect/atom-react/Hooks';

import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';

import { useFormatDigits } from './use-format-digits.hook';

export const useDisplayFormatDigits = () => useFormatDigits(useAtomValue(decimalPlacesAtom));
