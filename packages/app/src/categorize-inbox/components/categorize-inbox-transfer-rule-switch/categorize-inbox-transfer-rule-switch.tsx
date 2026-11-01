import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
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
    const label = isDefined(jarName) ? t`Also for new «${jarName}» payments` : t`Also for new “${displayTitle}” payments`;

    return (
        <GroupedListSection>
            <GroupedListSwitchRow
                icon={UserIconNameEnum.Repeat}
                title={label}
                subtitle={t`Saved as a rule`}
                value={value}
                switchTestID={CategorizeInboxTransferScreenSelector.RuleSwitch}
                onChange={onValueChange}
            />
        </GroupedListSection>
    );
};
