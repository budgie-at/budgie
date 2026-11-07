import { isDefined } from '@rnw-community/shared';

import { INZHUR_OPERATION_EXTERNAL_ID_PREFIX } from '../constant/inzhur-operation-external-id-prefix.constant';
import { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

export const parseInzhurOperationExternalId = (externalId: string) => {
    if (!externalId.startsWith(INZHUR_OPERATION_EXTERNAL_ID_PREFIX)) {
        return null;
    }

    const [seconds, rawKind, , amountMicroUnits] = externalId.slice(INZHUR_OPERATION_EXTERNAL_ID_PREFIX.length).split(':');
    const kind = Object.entries(InzhurOperationKindEnum).find(([name]) => name === rawKind)?.[1];

    return isDefined(kind) ? { occurredAt: new Date(Number(seconds) * 1000), kind, amountMicroUnits: Number(amountMicroUnits) } : null;
};
