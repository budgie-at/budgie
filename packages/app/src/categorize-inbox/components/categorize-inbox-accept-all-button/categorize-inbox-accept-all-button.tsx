import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { Button } from '../../../@generic/component/button/button';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxPanelSelector } from '../categorize-inbox-panel/categorize-inbox-panel.selector';

export const CategorizeInboxAcceptAllButton = () => {
    const { t } = useLingui();
    const { assign, acceptableAssignments } = useCategorizeInboxContext();

    const rowCount = acceptableAssignments.reduce((total, assignment) => total + assignment.rows.length, 0);
    const content = t({ message: plural(rowCount, { one: 'File # ready payment', other: 'File # ready payments' }) });

    const handlePress = (): void => void assign(acceptableAssignments);

    return (
        <Button
            variant="cta"
            size="md"
            leftIcon={UserIconNameEnum.CheckCheck}
            content={content}
            onPress={handlePress}
            testID={CategorizeInboxPanelSelector.AcceptAllButton}
        />
    );
};
