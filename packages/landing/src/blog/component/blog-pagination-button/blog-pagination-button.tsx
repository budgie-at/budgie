'use client';

interface Props {
    readonly currentPage: number;
    readonly onPageChange: (page: number) => void;
    readonly page: number;
}

export const BlogPaginationButton = ({ currentPage, onPageChange, page }: Props) => {
    const isActive = page === currentPage;
    const ariaCurrent = isActive && 'page';

    const className = isActive ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground';

    const handleClick = () => {
        onPageChange(page);
    };

    return (
        <button
            aria-current={ariaCurrent}
            className={`px-4 py-2 rounded-md transition-colors ${className}`}
            onClick={handleClick}
            type="button"
        >
            {page}
        </button>
    );
};
