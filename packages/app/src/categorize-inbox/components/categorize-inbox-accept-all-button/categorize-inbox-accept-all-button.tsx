import { convertFromMicroUnits, UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { getCategorizeInboxDefaultAmount } from '../../utils/get-categorize-inbox-default-amount.util';
import { CategorizeInboxPanelSelector } from '../categorize-inbox-panel/categorize-inbox-panel.selector';

export const CategorizeInboxAcceptAllButton = () => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { assign, acceptableAssignments } = useCategorizeInboxContext();

    const rows = acceptableAssignments.flatMap(assignment => assignment.rows);
    const rowCount = rows.length;
    const totalAmount = getCategorizeInboxDefaultAmount(rows, defaultInstrument);
    const total = isDefined(totalAmount) ? protectAmount(convertFromMicroUnits(totalAmount), defaultInstrument.symbol) : '';
    const content = isDefined(totalAmount)
        ? t({
              message: plural(rowCount, {
                  one: `File # ready payment · ${total}`,
                  other: `File # ready payments · ${total}`
              })
          })
        : t({ message: plural(rowCount, { one: 'File # ready payment', other: 'File # ready payments' }) });

    const handlePress = (): void => void assign(acceptableAssignments);

    return (
        <Button
            variant="cta"
            size="md"
            leftIcon={UserIconNameEnum.CheckCheck}
            content={content}
            onPress={handlePress}
            testID={CategorizeInboxPanelSelector.AcceptAllButton}
        />
    );
};
