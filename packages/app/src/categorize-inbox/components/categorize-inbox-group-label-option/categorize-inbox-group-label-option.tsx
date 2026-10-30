import { useLingui } from '@lingui/react/macro';

import { CategorizeInboxChoiceRow } from '../categorize-inbox-choice-row/categorize-inbox-choice-row';
import { CategorizeInboxLeadOption } from '../categorize-inbox-lead-option/categorize-inbox-lead-option';

import type { CategorizeInboxLabelInterface } from '../../interface/categorize-inbox-label.interface';

interface Props {
    readonly label: CategorizeInboxLabelInterface;
    readonly isBestMatch: boolean;
}

export const CategorizeInboxGroupLabelOption = ({ label, isBestMatch }: Props) => {
    const { t } = useLingui();

    if (isBestMatch) {
        return (
            <CategorizeInboxLeadOption
                choice={label.id}
                icon={label.icon}
                title={label.title}
                subtitle={t`Best match`}
                variant="positive"
            />
        );
    }

    return <CategorizeInboxChoiceRow choice={label.id} icon={label.icon} title={label.title} />;
};
