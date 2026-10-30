import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxIsTransfer } from '../../hook/use-categorize-inbox-is-transfer.hook';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'section' | 'rows' | 'displayTitle' | 'candidateLabelIds'>;
}

export const CategorizeInboxGroupRowSubtitle = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { strategy } = useCategorizeInboxContext();
    const isTransfer = useCategorizeInboxIsTransfer(cluster);

    const { section, rows, candidateLabelIds } = cluster;
    const candidateId = candidateLabelIds.at(0);
    const candidateTitle = isDefined(candidateId) ? strategy?.labelsById.get(candidateId)?.title : null;
    const isLikelyTransfer = section !== CategorizeInboxSectionEnum.CONFIDENT && isTransfer;
    const label = isLikelyTransfer ? t`Transfer` : candidateTitle;
    const paymentsText = t({ message: plural(rows.length, { one: '# payment', other: '# payments' }) });
    const labelledText = isNotEmptyString(label) ? `${paymentsText} · ${label}` : paymentsText;
    const text =
        section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS
            ? t({ message: plural(rows.length, { one: '# ATM withdrawal', other: '# ATM withdrawals' }) })
            : labelledText;

    return (
        <Text className="text-[13px] leading-[17px] text-secondary-foreground tabular-nums" numberOfLines={2}>
            {text}
        </Text>
    );
};
