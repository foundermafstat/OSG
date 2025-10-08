import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'OSG - One Screen Games',
	description: 'Transform any screen into an instant multiplayer arena. Your phone becomes the controller. No downloads. No installations. Just scan and play.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="antialiased">{children}</body>
		</html>
	);
}
