import { Trans } from '@lingui/react/macro';

interface Props {
    readonly className?: string;
    readonly date: string;
    readonly locale: string;
}

export const UpdatedDate = ({ className, date, locale }: Props) => {
    const formattedDate = new Date(date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

    return (
        <p className={className}>
            <Trans>
                Updated <time dateTime={date}>{formattedDate}</time>
            </Trans>
        </p>
    );
};
