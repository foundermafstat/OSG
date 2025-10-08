import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'QR Party - Multiplayer Game',
	description: 'Multiplayer gaming with mobile controllers',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ru">
			<body className="antialiased">{children}</body>
		</html>
	);
}
