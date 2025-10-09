import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
	subsets: ['latin', 'cyrillic'],
	weight: ['300', '400', '500', '600', '700'],
	variable: '--font-montserrat',
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'OSG - One Screen Games',
	description:
		'Transform any screen into an instant multiplayer arena. Your phone becomes the controller. No downloads. No installations. Just scan and play.',
	keywords: [
		'multiplayer games',
		'mobile controller',
		'party games',
		'browser games',
		'QR code gaming',
		'instant gaming',
		'no download games',
	],
	authors: [{ name: 'OSG Team' }],
	icons: {
		icon: '/logo-osg.jpg',
		shortcut: '/logo-osg.jpg',
		apple: '/logo-osg.jpg',
	},
	openGraph: {
		title: 'OSG - One Screen Games',
		description:
			'Turn any screen into an instant multiplayer arena. Your phone becomes the controller.',
		images: ['/logo-osg.jpg'],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'OSG - One Screen Games',
		description:
			'Turn any screen into an instant multiplayer arena. Your phone becomes the controller.',
		images: ['/logo-osg.jpg'],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${montserrat.variable} antialiased`}>{children}</body>
		</html>
	);
}
