import React from 'react';

const createSmoothScrollHandler = (targetId: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
    }
};

export const useSmoothScroll = () => ({
    handleScrollToFeatures: createSmoothScrollHandler('features'),
    handleScrollToTestimonials: createSmoothScrollHandler('testimonials'),
    handleScrollToWaitlist: createSmoothScrollHandler('waitlist'),
    handleScrollToFaq: createSmoothScrollHandler('faq')
});
