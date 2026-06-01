'use client';

import { Trans, useLingui } from '@lingui/react/macro';
import { Search, X } from 'lucide-react';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../ui/button';

import type { ChangeEvent } from 'react';

interface Props {
    readonly onSearch: (value: string) => void;
    readonly searchQuery: string;
}

export const BlogSearch = ({ onSearch, searchQuery }: Props) => {
    const { t } = useLingui();

    const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
        onSearch(event.target.value);
    };

    const handleClear = () => {
        onSearch('');
    };

    const hasQuery = isNotEmptyString(searchQuery);
    const hasSearchQuery = isNotEmptyString(searchQuery);

    return (
        <div className="max-w-2xl mx-auto">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />

                <input
                    className="w-full h-12 pl-12 pr-12 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    onChange={handleSearch}
                    placeholder={t`Search articles...`}
                    type="text"
                    value={searchQuery}
                />

                {hasQuery && (
                    <Button
                        className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full"
                        onClick={handleClear}
                        size="icon"
                        variant="ghost"
                    >
                        <X className="size-4" />
                    </Button>
                )}
            </div>

            {hasSearchQuery && (
                <p className="text-sm text-muted-foreground mt-4">
                    <Trans>
                        Showing results for: <span className="font-semibold text-foreground">{searchQuery}</span>
                    </Trans>
                </p>
            )}
        </div>
    );
};
