import { useAtomValue } from '@effect/atom-react/Hooks';

import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';
import { roundYieldParts } from '../utils/round-yield-parts.util';

export const useYieldRoundParts = () => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);

    return (parts: readonly number[], total: number): readonly number[] => {
        const sum = parts.reduce((accumulated, part) => accumulated + part, 0);
        const target = Math.abs(sum - total) <= 1 ? total : sum;

        return roundYieldParts(parts, target, decimalPlaces);
    };
};
