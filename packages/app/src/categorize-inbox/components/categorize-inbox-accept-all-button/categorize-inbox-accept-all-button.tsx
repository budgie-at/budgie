import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { Button } from '../../../@generic/component/button/button';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import { CategorizeInboxAcceptAllButtonSelector } from './categorize-inbox-accept-all-button.selector';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';

interface Props {
    readonly assignments: CategorizeInboxAssignmentInterface[];
}

export const CategorizeInboxAcceptAllButton = ({ assignments }: Props) => {
    const { t } = useLingui();
    const { assign } = useCategorizeInboxContext();

    const handlePress = (): void => void assign(assignments);

    const rowCount = assignments.reduce((total, assignment) => total + assignment.transactionIds.length, 0);

    return (
        <Button
            variant="cta"
            size="md"
            leftIcon={UserIconNameEnum.CheckCheck}
            content={t({ message: plural(rowCount, { one: 'Accept # suggestion', other: 'Accept # suggestions' }) })}
            onPress={handlePress}
            testID={CategorizeInboxAcceptAllButtonSelector.Button}
        />
    );
};
