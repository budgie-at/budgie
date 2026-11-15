import { ExternalSourceEnum } from '@budgie/contracts';
import { Plural, Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { getSinglePositionName } from '../../utils/get-single-position-name.util';
import { isFiatAccount } from '../../utils/is-fiat-account.util';

import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: Pick<InstitutionGroupInterface, 'provider' | 'accounts'>;
    readonly investedLabel: string;
}

export const HoldingProviderCaption = ({ institution, investedLabel }: Props) => {
    const positionName = getSinglePositionName(institution.accounts);
    const positionsCount = institution.accounts.filter(account => !isFiatAccount(account)).length;

    if (isDefined(positionName)) {
        return (
            <Trans>
                <Text className="font-medium text-primary tabular-nums">{investedLabel}</Text> in {positionName}
            </Trans>
        );
    }

    if (institution.provider === ExternalSourceEnum.MANUAL) {
        return (
            <Trans>
                <Text className="font-medium text-primary tabular-nums">{investedLabel}</Text> in{' '}
                <Plural value={positionsCount} one="# position" other="# positions" />
            </Trans>
        );
    }

    return (
        <Trans>
            <Text className="font-medium text-primary tabular-nums">{investedLabel}</Text> in{' '}
            <Plural value={positionsCount} one="# asset" other="# assets" />
        </Trans>
    );
};
