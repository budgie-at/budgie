import { ExternalSourceEnum } from '@budgie/contracts';
import { Plural } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { getSinglePositionName } from '../../utils/get-single-position-name.util';

import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: Pick<InstitutionGroupInterface, 'provider' | 'accounts' | 'positionCount'>;
}

export const HoldingProviderCaption = ({ institution }: Props) => {
    const positionName = getSinglePositionName(institution.accounts);
    const positionsCount = institution.positionCount;

    if (isDefined(positionName)) {
        return positionName;
    }

    if (institution.provider === ExternalSourceEnum.MANUAL) {
        return <Plural value={positionsCount} one="# position" other="# positions" />;
    }

    return <Plural value={positionsCount} one="# asset" other="# assets" />;
};
