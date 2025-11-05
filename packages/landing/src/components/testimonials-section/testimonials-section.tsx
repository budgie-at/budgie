'use client'

import { motion } from 'framer-motion';

import { Badge } from '../ui/badge';

import { TestimonialsCard } from './testimonials-card';

const testimonials = [
    {
        quote: "Finally, an expense tracker that doesn't spy on me! Budgie works perfectly offline and my bank sync is seamless. Love the multi-currency support.",
        author: 'Sarah Chen',
        role: 'Digital Nomad',
        rating: 5
    },
    {
        quote: 'The crypto tracking is incredible. I can see all my DeFi positions alongside my traditional accounts. The privacy-first approach sold me immediately.',
        author: 'Marcus Rodriguez',
        role: 'Crypto Investor',
        rating: 5
    },
    {
        quote: 'As a freelancer with multiple currencies, Budgie is a lifesaver. The debt tracking helped me pay off my student loans 6 months early!',
        author: 'Emily Johnson',
        role: 'Freelance Designer',
        rating: 5
    },
    {
        quote: 'Open source AND private? This is exactly what I was looking for. The goal tracking feature keeps me motivated to save for my house down payment.',
        author: 'David Kim',
        role: 'Software Engineer',
        rating: 5
    },
    {
        quote: "I've tried every expense app out there. Budgie is the only one that works completely offline while still syncing my bank accounts when I'm online.",
        author: 'Lisa Patel',
        role: 'Travel Blogger',
        rating: 5
    },
    {
        quote: 'The stock portfolio tracking alongside my daily expenses gives me a complete financial picture. Plus, knowing my data never leaves my phone is priceless.',
        author: 'James Wilson',
        role: 'Investment Advisor',
        rating: 5
    }
];

export const TestimonialsSection = () => (
    <section className="w-full py-20 md:py-32" id="testimonials">
        <div className="container px-4 md:px-6">
            <motion.div
                className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
            >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                    Testimonials
                </Badge>

                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Trusted by Privacy-Conscious Users</h2>

                <p className="max-w-[800px] text-muted-foreground md:text-lg">
                    See what users love about Budgie&apos;s approach to private, comprehensive expense tracking.
                </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {testimonials.map(({ role, rating, quote, author }, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        key={quote}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        viewport={{ once: true }}
                        whileInView={{ opacity: 1, y: 0 }}
                    >
                        <TestimonialsCard author={author} quote={quote} rating={rating} role={role} />
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);
