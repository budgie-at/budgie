/* eslint-disable max-statements */
/* eslint-disable no-plusplus */
/* eslint-disable require-unicode-regexp */
 
/* eslint-disable @rnw-community/no-complex-jsx-logic */
/* eslint-disable no-continue */

'use client';

import { ReactElement } from 'react';

import { Motion } from '../../../../lib/motion';

interface BlogArticleContentProps {
    content: string;
}

const initialMotion = { opacity: 0, y: 20 };
const transitionMotion = { duration: 0.5, delay: 0.1 };

export const BlogArticleContent = ({ content }: BlogArticleContentProps) => {
    // Split content by lines and render with proper formatting
    const renderContent = () => {
        const lines = content.split('\n');
        const elements: ReactElement[] = [];
        let currentIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Headers
            if (line.startsWith('# ')) {
                elements.push(
                    <h1 key={`h1-${currentIndex++}`} className="text-4xl md:text-5xl font-bold tracking-tight mb-6 mt-12">
                        {line.substring(2)}
                    </h1>
                );
            } else if (line.startsWith('## ')) {
                elements.push(
                    <h2 key={`h2-${currentIndex++}`} className="text-3xl md:text-4xl font-bold tracking-tight mb-4 mt-10">
                        {line.substring(3)}
                    </h2>
                );
            } else if (line.startsWith('### ')) {
                elements.push(
                    <h3 key={`h3-${currentIndex++}`} className="text-2xl md:text-3xl font-bold tracking-tight mb-3 mt-8">
                        {line.substring(4)}
                    </h3>
                );
            } else if (line.startsWith('**') && line.endsWith('**')) {
                // Bold paragraph (scenario titles, etc.)
                elements.push(
                    <p key={`bold-${currentIndex++}`} className="text-lg font-bold mb-2 mt-4">
                        {line.replace(/\*\*/g, '')}
                    </p>
                );
            } else if (line.startsWith('- ✅')) {
                // Checklist items
                elements.push(
                    <div key={`check-${currentIndex++}`} className="flex items-start gap-2 mb-2">
                        <span className="text-primary mt-1">✅</span>
                        <span className="text-base">{line.substring(4)}</span>
                    </div>
                );
            } else if (line.startsWith('- ')) {
                // Regular list items
                elements.push(
                    <li key={`li-${currentIndex++}`} className="text-base mb-2 ml-6">
                        {line.substring(2)}
                    </li>
                );
            } else if (line.startsWith('---')) {
                // Horizontal rule
                elements.push(<hr key={`hr-${currentIndex++}`} className="my-8 border-border" />);
            } else if (line.trim() === '') {
                // Empty line - skip
                continue;
            } else {
                // Regular paragraph - process inline formatting safely
                const parts = line.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
                const paragraphIndex = currentIndex++;
                const processedParts = parts.map((part, idx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={`strong-${paragraphIndex}-${idx}`}>{part.slice(2, -2)}</strong>;
                    } else if (part.match(/\[(.*?)\]\((.*?)\)/)) {
                        const match = part.match(/\[(.*?)\]\((.*?)\)/);

                        if (match) {
                            const [, text, url] = match;

                            // Only allow http, https, and anchor links
                            if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('#')) {
                                return (
                                    <a key={`link-${paragraphIndex}-${idx}`} className="text-primary hover:underline" href={url}>
                                        {text}
                                    </a>
                                );
                            }

                            return text;
                        }
                    }

                    return part;
                });

                elements.push(
                    <p key={`p-${paragraphIndex}`} className="text-base md:text-lg leading-relaxed mb-4 text-muted-foreground">
                        {processedParts}
                    </p>
                );
            }
        }

        return elements;
    };

    return (
        <Motion animate={{ opacity: 1, y: 0 }} initial={initialMotion} transition={transitionMotion}>
            <div className="prose prose-lg dark:prose-invert max-w-none">{renderContent()}</div>
        </Motion>
    );
};
