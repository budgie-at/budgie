import { convertFromMicroUnits } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { CategorizeInboxFindingKindEnum } from '../../enum/categorize-inbox-finding-kind.enum';
import { useCategorizeInboxMatchedAccount } from '../../hook/use-categorize-inbox-matched-account.hook';
import { getCategorizeInboxFinding } from '../../utils/get-categorize-inbox-finding.util';
import { CategorizeInboxFindingEmphasis } from '../categorize-inbox-finding-emphasis/categorize-inbox-finding-emphasis';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { ReactNode } from 'react';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupFinding = ({ cluster }: Props) => {
    const protectAmount = useProtectedAmountLabel();

    const matchedAccount = useCategorizeInboxMatchedAccount(cluster);

    const { kind, jarName, accountTitle, count, rate, isPerDay, maxAmount } = getCategorizeInboxFinding(
        cluster,
        matchedAccount?.title ?? null
    );
    const jar = jarName ?? '';
    const account = accountTitle ?? '';
    const symbol = cluster.rows.at(0)?.instrumentSymbol ?? '';
    const maxAmountLabel = protectAmount(convertFromMicroUnits(maxAmount), symbol);

    const rateBody = isPerDay ? (
        <Trans>
            About {rate} a day, every one under {maxAmountLabel}.
        </Trans>
    ) : (
        <Trans>
            About {rate} a week, every one under {maxAmountLabel}.
        </Trans>
    );

    const topUpEmphasis = isDefined(accountTitle) ? (
        <Trans>Looks like a top-up of «{account}».</Trans>
    ) : (
        <Trans>Looks like a jar top-up.</Trans>
    );

    const returnEmphasis = isDefined(accountTitle) ? (
        <Trans>Money coming back from «{account}».</Trans>
    ) : (
        <Trans>Money coming back from your «{jar}» jar.</Trans>
    );

    const jarTopUpBody = (
        <Text>
            {rateBody} <CategorizeInboxFindingEmphasis>{topUpEmphasis}</CategorizeInboxFindingEmphasis>
        </Text>
    );

    const bodies: Record<CategorizeInboxFindingKindEnum, ReactNode> = {
        [CategorizeInboxFindingKindEnum.CASH]: (
            <Trans>
                <CategorizeInboxFindingEmphasis>Cash from an ATM.</CategorizeInboxFindingEmphasis> Move it to your cash wallet or mark it
                tracked.
            </Trans>
        ),
        [CategorizeInboxFindingKindEnum.JAR_TOP_UP]: jarTopUpBody,
        [CategorizeInboxFindingKindEnum.JAR_RETURN]: <CategorizeInboxFindingEmphasis>{returnEmphasis}</CategorizeInboxFindingEmphasis>,
        [CategorizeInboxFindingKindEnum.MONTHLY]: (
            <CategorizeInboxFindingEmphasis>
                <Trans>Arrives once a month.</Trans>
            </CategorizeInboxFindingEmphasis>
        ),
        [CategorizeInboxFindingKindEnum.GENERIC]: <Trans>{count} payments with exactly this title.</Trans>
    };

    return <Text className="text-secondary-foreground text-sm">{bodies[kind]}</Text>;
};
