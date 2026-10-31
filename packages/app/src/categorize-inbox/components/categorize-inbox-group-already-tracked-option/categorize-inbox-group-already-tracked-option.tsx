import { CategorizeInboxLabelKindEnum } from '@budgie/categorization';
import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxGroupChoiceEnum } from '../../enum/categorize-inbox-group-choice.enum';
import { CategorizeInboxChoiceRow } from '../categorize-inbox-choice-row/categorize-inbox-choice-row';

export const CategorizeInboxGroupAlreadyTrackedOption = () => {
    const { t } = useLingui();
    const { strategy } = useCategorizeInboxContext();

    if (strategy?.labelKind !== CategorizeInboxLabelKindEnum.CATEGORY) {
        return null;
    }

    return (
        <CategorizeInboxChoiceRow
            choice={CategorizeInboxGroupChoiceEnum.ALREADY_TRACKED}
            icon={UserIconNameEnum.CheckCheck}
            title={t`Already tracked`}
        />
    );
};
