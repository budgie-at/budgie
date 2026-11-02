import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useCategorizeInboxMatchedAccount } from '../../hook/use-categorize-inbox-matched-account.hook';
import { getCategorizeInboxJarName } from '../../utils/get-categorize-inbox-jar-name.util';
import { CategorizeInboxTransferScreenSelector } from '../categorize-inbox-transfer-screen/categorize-inbox-transfer-screen.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly value: boolean;
    readonly onValueChange: (value: boolean) => void;
}

export const CategorizeInboxTransferRuleSwitch = ({ cluster, value, onValueChange }: Props) => {
    const { t } = useLingui();

    const matchedAccount = useCategorizeInboxMatchedAccount(cluster);

    const { displayTitle } = cluster;
    const jarName = getCategorizeInboxJarName(displayTitle) ?? (isDefined(matchedAccount) ? displayTitle : null);
    const title = t`Do this automatically`;
    const subtitle = isDefined(jarName) ? t`Future «${jarName}» payments` : t`Future “${displayTitle}” payments`;
    const subtitleNode = (
        <Text className="text-secondary-foreground text-[13px] leading-[17px]" numberOfLines={2}>
            {subtitle}
        </Text>
    );
    const switchNode = (
        <ThemedSwitch
            value={value}
            onValueChange={onValueChange}
            accessibilityLabel={`${title}, ${subtitle}`}
            testID={CategorizeInboxTransferScreenSelector.RuleSwitch}
        />
    );

    return (
        <GroupedListSection>
            <GroupedListRow
                left={<GroupedListIcon icon={UserIconNameEnum.Repeat} />}
                title={title}
                subtitle={subtitleNode}
                right={switchNode}
            />
        </GroupedListSection>
    );
};
