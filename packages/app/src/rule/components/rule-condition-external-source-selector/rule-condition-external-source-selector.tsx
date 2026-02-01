import { useLingui } from '@lingui/react/macro';

import { typedObjectEntries } from '../../../@generic/utils/typed-object-entries.util';
import { EXTERNAL_SOURCE } from '../../constant/external-source.constant';
import { RuleConditionValueEnumSelector } from '../rule-condition-value-enum-selector/rule-condition-value-enum-selector';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

const EXTERNAL_SOURCE_OPTIONS = typedObjectEntries(EXTERNAL_SOURCE).map(([value, label]) => ({
    value,
    label
}));

export const RuleConditionExternalSourceSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();

    return (
        <RuleConditionValueEnumSelector
            index={index}
            options={EXTERNAL_SOURCE_OPTIONS}
            sheetTitle={t`Select External Source`}
            defaultLabel={t`Select source`}
            testID={testID}
        />
    );
};
