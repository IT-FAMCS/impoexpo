export function Head() {
	return (
		<>
			<link rel="preconnect" href="https://rsms.me/" />
			<link rel="stylesheet" href="https://rsms.me/inter/inter.css" />

			<script async defer src="https://apis.google.com/js/api.js" />
			<script src="https://accounts.google.com/gsi/client" async />

			<meta property="og:type" content="website" />
			<meta property="og:url" content="https://impoexpo.ru" />
			<meta property="og:image" content="https://impoexpo.ru/favicon.png" />
			<meta property="og:locale" content="en_US" />
			<meta property="og:locale:alternate" content="ru_RU" />

			<link href="/favicon.png" rel="icon" />
		</>
	);
}
