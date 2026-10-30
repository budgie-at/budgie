import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxRowsTotalLabel } from '../../hook/use-categorize-inbox-rows-total-label.hook';
import { CategorizeInboxCtaButton } from '../categorize-inbox-cta-button/categorize-inbox-cta-button';
import { CategorizeInboxPanelSelector } from '../categorize-inbox-panel/categorize-inbox-panel.selector';

export const CategorizeInboxAcceptAllButton = () => {
    const { t } = useLingui();
    const { assign, acceptableAssignments } = useCategorizeInboxContext();

    const rows = acceptableAssignments.flatMap(assignment => assignment.rows);
    const rowCount = rows.length;
    const total = useCategorizeInboxRowsTotalLabel(rows);
    const content = isDefined(total)
        ? t({
              message: plural(rowCount, {
                  one: `File # ready payment · ${total}`,
                  other: `File # ready payments · ${total}`
              })
          })
        : t({ message: plural(rowCount, { one: 'File # ready payment', other: 'File # ready payments' }) });

    const handlePress = (): void => void assign(acceptableAssignments);

    return <CategorizeInboxCtaButton label={content} testID={CategorizeInboxPanelSelector.AcceptAllButton} onPress={handlePress} />;
};
