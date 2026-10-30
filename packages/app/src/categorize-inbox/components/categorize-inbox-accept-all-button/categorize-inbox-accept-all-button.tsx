import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { getCategorizeInboxDefaultAmount } from '../../utils/get-categorize-inbox-default-amount.util';
import { CategorizeInboxPanelSelector } from '../categorize-inbox-panel/categorize-inbox-panel.selector';

const continuousCorners = { borderCurve: 'continuous' as const };

export const CategorizeInboxAcceptAllButton = () => {
    const { t } = useLingui();
    const amountLabel = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { assign, acceptableAssignments } = useCategorizeInboxContext();

    const rows = acceptableAssignments.flatMap(assignment => assignment.rows);
    const rowCount = rows.length;
    const totalAmount = getCategorizeInboxDefaultAmount(rows, defaultInstrument);
    const total = isDefined(totalAmount) ? amountLabel(totalAmount, defaultInstrument.symbol) : '';
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
        <HapticPressable
            className="h-[52px] items-center justify-center rounded-full bg-cta-background px-5xl active:opacity-80"
            style={continuousCorners}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={content}
            testID={CategorizeInboxPanelSelector.AcceptAllButton}
        >
            <Text className="text-[17px] font-semibold text-cta-foreground tabular-nums" numberOfLines={1}>
                {content}
            </Text>
        </HapticPressable>
    );
};
