import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
    metadataBase: new URL('https://oro-pageant-2026.mossy-joy-4772.chatgpt.site'),
    title: "Oro 2026 | People's Choice",
    description: 'Culture. Confidence. Community. Discover the Oro Provincial Pageant and support her journey.',
    openGraph: { title: "Oro 2026 | People's Choice", description: 'Celebrating the extraordinary spirit of Oro Province. Event preview — official voting coming soon.', images: [{ url: '/share-card.png', width: 1200, height: 630 }] },
    icons: { icon: '/favicon.svg' }
};
export default function Layout({ children }: {
    children: React.ReactNode;
}) { return <html lang="en"><body>{children}</body></html>; }
