import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';

export const AiUnavailableSection = () => {
    const { t } = useLingui();

    return (
        <GroupedListSection title={t`Status`}>
            <GroupedListRow
                left={<GroupedListIcon icon={UserIconNameEnum.Sparkles} />}
                title={t`Not available in this version`}
                subtitle={t`Categories still use on-device rules.`}
            />
        </GroupedListSection>
    );
};
