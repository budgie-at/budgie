import { isDefined } from '@rnw-community/shared';

import type { AmountFieldPartWidthActionInterface } from '../../interface/amount-field-part-width-action.interface';
import type { AmountFieldPartWidthInterface } from '../../interface/amount-field-part-width.interface';

type PartWidths = Readonly<Record<string, AmountFieldPartWidthInterface>>;

export const reducePartWidths = (partWidths: PartWidths, { partId, partWidth }: AmountFieldPartWidthActionInterface): PartWidths => {
    const hasPart = partId in partWidths;

    if (!isDefined(partWidth)) {
        return hasPart ? Object.fromEntries(Object.entries(partWidths).filter(([currentPartId]) => currentPartId !== partId)) : partWidths;
    }

    const isUnchanged =
        hasPart && partWidths[partId].width === partWidth.width && partWidths[partId].minimumWidth === partWidth.minimumWidth;

    return isUnchanged ? partWidths : { ...partWidths, [partId]: partWidth };
};
