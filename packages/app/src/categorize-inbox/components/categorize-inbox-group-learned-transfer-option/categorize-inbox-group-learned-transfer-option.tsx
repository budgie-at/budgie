import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CategorizeInboxGroupChoiceEnum } from '../../enum/categorize-inbox-group-choice.enum';
import { CategorizeInboxLeadOption } from '../categorize-inbox-lead-option/categorize-inbox-lead-option';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'title'>;
}

export const CategorizeInboxGroupLearnedTransferOption = ({ account }: Props) => {
    const { t } = useLingui();

    const { title } = account;

    return (
        <CategorizeInboxLeadOption
            choice={CategorizeInboxGroupChoiceEnum.LEARNED_TRANSFER}
            icon={UserIconNameEnum.ArrowLeftRight}
            title={t`Transfer to ${title}`}
            subtitle={t`Suggested`}
            variant="positive"
        />
    );
};
