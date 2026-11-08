import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly className?: string;
    readonly date: string;
    readonly locale: string;
    readonly publishedDate?: string;
}

export const UpdatedDate = ({ className, date, locale, publishedDate }: Props) => {
    const formatDate = (value: string) =>
        new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    const formattedDate = formatDate(date);
    const formattedPublishedDate = isDefined(publishedDate) ? formatDate(publishedDate) : '';

    const hasPublishedDate = isDefined(publishedDate);
    const isUpdated = !hasPublishedDate || publishedDate !== date;

    return (
        <p className={className}>
            {hasPublishedDate && (
                <>
                    <Trans>
                        Published <time dateTime={publishedDate}>{formattedPublishedDate}</time>
                    </Trans>
                    {isUpdated && ' · '}
                </>
            )}
            {isUpdated && (
                <Trans>
                    Updated <time dateTime={date}>{formattedDate}</time>
                </Trans>
            )}
        </p>
    );
};
