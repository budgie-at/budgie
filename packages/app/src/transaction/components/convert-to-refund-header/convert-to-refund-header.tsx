import { useLingui } from '@lingui/react/macro';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

export const ConvertToRefundHeader = () => {
    const { t } = useLingui();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const size = isAccessibilityTextSize ? 'sm' : 'md';
    const title = isAccessibilityTextSize ? t`Expenses` : t`Convert to Refund`;
    const description = isAccessibilityTextSize ? '' : t`Select the original expense for this refund.`;

    return (
        <FormsheetHeader
            size={size}
            title={title}
            description={description}
            descriptionClassName="leading-[18px]"
            titleClassName="leading-[22px]"
        />
    );
};
