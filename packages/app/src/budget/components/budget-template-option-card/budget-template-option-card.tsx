import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GROUPED_LIST_SUBTITLE_CLASSNAME } from '../../../@generic/constant/grouped-list-subtitle-class-name.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';

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
    const titleClassName = isDisabled ? 'text-secondary-foreground text-[17px]' : 'text-primary font-medium text-[17px]';

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={icon} />}
            title={
                <Text className={titleClassName} numberOfLines={3} maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
                    {title}
                </Text>
            }
            subtitle={
                <Text
                    className={cn('text-secondary-foreground', GROUPED_LIST_SUBTITLE_CLASSNAME)}
                    numberOfLines={3}
                    maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {subtitle}
                </Text>
            }
            testID={testID}
            {...(!isDisabled && { onPress })}
        />
    );
};
