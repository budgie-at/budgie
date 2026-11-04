import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly index: number;
}

export const ApplePayCaptureSetupRow = ({ title, description, index }: Props) => {
    const { t } = useLingui();
    const stepNumber = index + 1;

    return (
        <GroupedListRow
            title={title}
            subtitle={<Text className="text-[13px] leading-[18px] text-secondary-foreground">{description}</Text>}
            left={
                <View
                    accessible
                    accessibilityLabel={t`Step ${stepNumber}`}
                    className="size-[36px] rounded-full bg-surface-disc items-center justify-center"
                >
                    <Text className="text-secondary-foreground text-[17px]">{stepNumber}</Text>
                </View>
            }
        />
    );
};
