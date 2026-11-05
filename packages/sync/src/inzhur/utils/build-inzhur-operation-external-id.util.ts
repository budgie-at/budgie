import { INZHUR_OPERATION_EXTERNAL_ID_PREFIX } from '../constant/inzhur-operation-external-id-prefix.constant';

import type { InzhurOperationIdPartsInterface } from '../interface/inzhur-operation-id-parts.interface';

export const buildInzhurOperationExternalId = ({
    seconds,
    kind,
    fundKey,
    amountMicroUnits,
    ordinal
}: InzhurOperationIdPartsInterface): string =>
    `${INZHUR_OPERATION_EXTERNAL_ID_PREFIX}${seconds}:${kind}:${fundKey}:${amountMicroUnits}:${ordinal}`;
