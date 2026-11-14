import { useLingui } from '@lingui/react/macro';

import { SelectorSheetList } from '../../../@generic/component/selector-sheet-list/selector-sheet-list';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { buildYieldKindOptions } from '../../utils/build-yield-kind-options.util';
import { YieldKindOptionRow } from '../yield-kind-option-row/yield-kind-option-row';

import type { ModalParams } from '../../../@generic/type/modal-params.type';
import type { YieldKindEnum } from '@budgie/contracts';

interface Props {
    readonly params: ModalParams<'/yield-kind'>;
    readonly onCommit: (kind: YieldKindEnum) => void;
}

export const YieldKindSelectorContent = ({ params, onCommit }: Props) => {
    const { t } = useLingui();
    const commit = useMorphingSheetCommit(onCommit);

    return (
        <SelectorSheetList title={t`Passive income`}>
            {buildYieldKindOptions(params.transactionType).map(kind => (
                <YieldKindOptionRow key={kind} kind={kind} isSelected={params.selectedKind === kind} onSelect={commit} />
            ))}
        </SelectorSheetList>
    );
};
