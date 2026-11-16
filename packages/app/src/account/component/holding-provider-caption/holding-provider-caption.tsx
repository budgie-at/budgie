import { ExternalSourceEnum } from '@budgie/contracts';
import { Plural } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: Pick<InstitutionGroupInterface, 'provider' | 'positionCount' | 'positionName'>;
}

export const HoldingProviderCaption = ({ institution }: Props) => {
    const { positionName } = institution;
    const positionsCount = institution.positionCount;

    if (isDefined(positionName)) {
        return positionName;
    }

    if (institution.provider === ExternalSourceEnum.MANUAL) {
        return <Plural value={positionsCount} one="# position" other="# positions" />;
    }

    return <Plural value={positionsCount} one="# asset" other="# assets" />;
};
