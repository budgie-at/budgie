import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

interface Props {
    readonly value: boolean;
    readonly onValueChange: (value: boolean) => void;
    readonly testID: string;
}

export const BudgetAutoTuneSwitchRow = ({ value, onValueChange, testID }: Props) => {
    const { t } = useLingui();
    const isLargeText = useIsLargeTextSize();
    const title = t`Tune limits automatically`;
    const leading = isLargeText ? null : <GroupedListIcon icon={UserIconNameEnum.WandSparkles} />;
    const handlePress = () => void onValueChange(!value);
    const pressableProps = { accessibilityState: { checked: value } };

    return (
        <GroupedListSection>
            <GroupedListRow
                {...testIDProps(testID, TestIDPartEnum.DETAILS)}
                left={leading}
                title={
                    <Text className="text-primary text-[17px]" maxFontSizeMultiplier={2}>
                        {title}
                    </Text>
                }
                subtitle={
                    <Text
                        className="text-secondary-foreground text-[13px] leading-[18px]"
                        maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                    >
                        {t`Adjusts category limits after 3 periods of steady over or under spending`}
                    </Text>
                }
                onPress={handlePress}
                pressableProps={pressableProps}
                right={<ThemedSwitch value={value} onValueChange={onValueChange} accessibilityLabel={title} testID={testID} />}
            />
        </GroupedListSection>
    );
};
