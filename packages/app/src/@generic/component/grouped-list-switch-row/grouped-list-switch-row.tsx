import { UserIconType } from '@budgie/contracts';

import { CircleIcon } from '../circle-icon/circle-icon';
import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { ThemedSwitch } from '../themed-switch/themed-switch';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly subtitle: string;
    readonly value: boolean | undefined;
    readonly testID: string;
    readonly titleTestID: string;
    readonly switchTestID: string;
    readonly onChange: (value: boolean) => void;
}

export const GroupedListSwitchRow = ({ icon, title, subtitle, value, testID, titleTestID, switchTestID, onChange }: Props) => {
    const handlePress = () => void onChange(!value);

    return (
        <GroupedListRow
            left={
                <CircleIcon
                    icon={icon}
                    variant="secondary"
                    size={36}
                    iconSize={18}
                    radius={18}
                    border={false}
                    className="bg-surface-disc"
                />
            }
            title={title}
            subtitle={subtitle}
            testID={testID}
            titleTestID={titleTestID}
            onPress={handlePress}
            right={<ThemedSwitch value={value} onValueChange={onChange} accessibilityLabel={title} testID={switchTestID} />}
        />
    );
};
