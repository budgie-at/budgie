import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxRowsTotalLabel } from '../../hook/use-categorize-inbox-rows-total-label.hook';
import { CategorizeInboxCtaButton } from '../categorize-inbox-cta-button/categorize-inbox-cta-button';
import { CategorizeInboxPanelSelector } from '../categorize-inbox-panel/categorize-inbox-panel.selector';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';

interface Props {
    readonly rows: CategorizeInboxRowInterface[];
}

export const CategorizeInboxMoveAllToCashButton = ({ rows }: Props) => {
    const { t } = useLingui();
    const { moveToCash } = useCategorizeInboxContext();

    const rowCount = rows.length;
    const total = useCategorizeInboxRowsTotalLabel(rows);
    const content = isDefined(total) ? t`Move ${rowCount} to cash · ${total}` : t`Move ${rowCount} to cash`;

    const handlePress = (): void => void moveToCash(rows.map(row => row.transactionId));

    return <CategorizeInboxCtaButton label={content} testID={CategorizeInboxPanelSelector.MoveAllToCashButton} onPress={handlePress} />;
};
