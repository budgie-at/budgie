import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';

import { EmptyFn } from '@rnw-community/shared';

import { AccountFormSelectors } from '../../../@e2e/selectors/account-form.selector';
import { Button } from '../../../@generic/component/button/button';
import { FormPage } from '../../../@generic/component/form-page/form-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';

interface Props {
    readonly title: string;
    readonly description?: string;
    readonly descriptionClassName?: string;
    readonly variant: ColorPaletteVariant;
    readonly onSubmit: EmptyFn;
    readonly children: ReactNode;
}

export const CreateAccountScreen = (props: Props) => {
    const { title, description, descriptionClassName, variant, children, onSubmit } = props;
    const { t } = useLingui();

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormPage
            header={
                <PageHeader
                    title={title}
                    onGoBack={handleGoBack}
                    descriptionClassName={descriptionClassName}
                    description={description ?? t`Fill in the account details`}
                />
            }
            footer={<Button variant={variant} onPress={onSubmit} content={t`Submit`} testID={AccountFormSelectors.SubmitButton} />}
        >
            {children}
        </FormPage>
    );
};
