import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { BudgetDataState } from '../budget-data-state/budget-data-state';

interface Props {
    readonly title: string;
    readonly isLoading: boolean;
    readonly isError?: boolean;
}

export const BudgetPageState = ({ title, isLoading, isError }: Props) => (
    <CollapsibleChromePage title={title} leading={<HeaderBackButton />}>
        <BudgetDataState isLoading={isLoading} isError={isError} />
    </CollapsibleChromePage>
);
