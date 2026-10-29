import { convertFromMicroUnits } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { CategorizeInboxFindingKindEnum } from '../../enum/categorize-inbox-finding-kind.enum';
import { getCategorizeInboxFinding } from '../../utils/get-categorize-inbox-finding.util';
import { CategorizeInboxFindingEmphasis } from '../categorize-inbox-finding-emphasis/categorize-inbox-finding-emphasis';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { ReactNode } from 'react';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupFinding = ({ cluster }: Props) => {
    const protectAmount = useProtectedAmountLabel();

    const { kind, jarName, count, rate, isPerDay, maxAmount } = getCategorizeInboxFinding(cluster);
    const jar = jarName ?? '';
    const symbol = cluster.rows.at(0)?.instrumentSymbol ?? '';
    const maxAmountLabel = protectAmount(convertFromMicroUnits(maxAmount), symbol);

    const jarTopUpBody = isPerDay ? (
        <Trans>
            About {rate} a day, every one under {maxAmountLabel}.{' '}
            <CategorizeInboxFindingEmphasis>Looks like a jar top-up.</CategorizeInboxFindingEmphasis>
        </Trans>
    ) : (
        <Trans>
            About {rate} a week, every one under {maxAmountLabel}.{' '}
            <CategorizeInboxFindingEmphasis>Looks like a jar top-up.</CategorizeInboxFindingEmphasis>
        </Trans>
    );

    const bodies: Record<CategorizeInboxFindingKindEnum, ReactNode> = {
        [CategorizeInboxFindingKindEnum.CASH]: (
            <Trans>
                <CategorizeInboxFindingEmphasis>Cash from an ATM.</CategorizeInboxFindingEmphasis> Move it to your cash wallet or mark it
                tracked.
            </Trans>
        ),
        [CategorizeInboxFindingKindEnum.JAR_TOP_UP]: jarTopUpBody,
        [CategorizeInboxFindingKindEnum.JAR_RETURN]: (
            <CategorizeInboxFindingEmphasis>
                <Trans>Money coming back from your «{jar}» jar.</Trans>
            </CategorizeInboxFindingEmphasis>
        ),
        [CategorizeInboxFindingKindEnum.MONTHLY]: (
            <CategorizeInboxFindingEmphasis>
                <Trans>Arrives once a month.</Trans>
            </CategorizeInboxFindingEmphasis>
        ),
        [CategorizeInboxFindingKindEnum.GENERIC]: <Trans>{count} payments with exactly this title.</Trans>
    };

    return <Text className="text-secondary-foreground text-sm">{bodies[kind]}</Text>;
};
