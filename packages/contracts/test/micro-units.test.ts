import { describe, it } from '@effect/vitest';
import * as Schema from 'effect/Schema';
import { expect } from 'vitest';

import { PRECISION } from '../src/@generic/constant/precision.constant';
import { convertFromMicroUnits } from '../src/@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../src/@generic/utils/convert-to-micro-units.util';

const microUnits = Schema.Int.check(Schema.isBetween({ minimum: -1_000_000_000_000, maximum: 1_000_000_000_000 }));

describe('micro units', () => {
    it.prop('round-trips amounts with up to six decimals', { microUnits }, ({ microUnits }) => {
        expect(convertToMicroUnits(convertFromMicroUnits(microUnits))).toBe(microUnits);
    });

    it.prop('is monotonic', { first: microUnits, second: microUnits }, ({ first, second }) => {
        const [lower, upper] = first <= second ? [first, second] : [second, first];

        expect(convertToMicroUnits(convertFromMicroUnits(lower))).toBeLessThanOrEqual(convertToMicroUnits(convertFromMicroUnits(upper)));
    });

    it.prop('preserves sign', { microUnits }, ({ microUnits }) => {
        expect(Math.sign(convertToMicroUnits(microUnits / PRECISION))).toBe(Math.sign(microUnits));
    });
});
