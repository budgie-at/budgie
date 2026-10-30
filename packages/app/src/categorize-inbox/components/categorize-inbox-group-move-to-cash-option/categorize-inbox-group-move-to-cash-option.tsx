import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CategorizeInboxGroupChoiceEnum } from '../../enum/categorize-inbox-group-choice.enum';
import { CategorizeInboxChoiceRow } from '../categorize-inbox-choice-row/categorize-inbox-choice-row';

export const CategorizeInboxGroupMoveToCashOption = () => {
    const { t } = useLingui();

    return (
        <CategorizeInboxChoiceRow
            choice={CategorizeInboxGroupChoiceEnum.MOVE_TO_CASH}
            icon={UserIconNameEnum.Banknote}
            title={t`Move to cash`}
            subtitle={t`Becomes a transfer to your cash wallet`}
        />
    );
};
