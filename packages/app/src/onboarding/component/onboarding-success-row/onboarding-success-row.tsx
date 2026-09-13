import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

const SUCCESS_ICON_SIZE = 40;
const SUCCESS_ICON_INNER_SIZE = 20;

interface Props {
    readonly label: string;
    readonly testID?: string;
}

export const OnboardingSuccessRow = ({ label, testID }: Props) => (
    <View
        {...testIDProps(testID)}
        className="flex-row items-center gap-x-md rounded-3xl border border-secondary-corner/50 bg-secondary-background p-3xl"
    >
        <CircleIcon
            icon={UserIconNameEnum.CircleCheck}
            variant="positive"
            border={false}
            size={SUCCESS_ICON_SIZE}
            iconSize={SUCCESS_ICON_INNER_SIZE}
        />
        <Text className="text-primary text-md font-medium flex-1">{label}</Text>
    </View>
);
