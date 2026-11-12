import { UserIconNameEnum } from '@budgie/contracts';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly testID: string;
    readonly icon: UserIconType;
    readonly isImported: boolean;
    readonly title: string;
    readonly subtitle: string;
    readonly onPress: () => void;
}

export const OnboardingImportRow = ({ testID, icon, isImported, title, subtitle, onPress }: Props) => {
    const rowIcon = isImported ? UserIconNameEnum.CircleCheck : icon;
    const iconClassName = isImported ? 'text-positive-foreground' : 'text-secondary-foreground';

    return (
        <GroupedListRow
            testID={testID}
            left={<GroupedListIcon icon={rowIcon} iconClassName={iconClassName} />}
            title={title}
            subtitle={subtitle}
            onPress={onPress}
        />
    );
};
