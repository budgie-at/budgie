import { UserIconNameEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly description: string;
    readonly summary?: string;
    readonly onPress: () => void;
    readonly isDisabled?: boolean;
    readonly testID?: string;
}

export const BudgetTemplateOptionCard = ({ icon, title, description, summary, onPress, isDisabled = false, testID }: Props) => {
    const subtitle = isDefined(summary) ? `${description}\n${summary}` : description;
    const titleClassName = isDisabled ? 'text-secondary-foreground' : 'font-medium';

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={icon} />}
            title={title}
            titleClassName={titleClassName}
            subtitle={subtitle}
            testID={testID}
            {...(!isDisabled && { onPress })}
        />
    );
};
