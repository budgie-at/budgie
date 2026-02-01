import { isDefined } from '@rnw-community/shared';

import { RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';
import { RulePrefillDataSchema } from '../schema/rule-prefill-data.schema';

export const parseRulePrefillData = (prefillJson: string | undefined): RulePrefillDataInterface | null => {
    if (!isDefined(prefillJson)) {
        return null;
    }

    try {
        const parsed: unknown = JSON.parse(prefillJson);
        const result = RulePrefillDataSchema.safeParse(parsed);

        return result.success ? result.data : null;
    } catch {
        return null;
    }
};
