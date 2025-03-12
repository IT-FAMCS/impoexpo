--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
CREATE TABLE "google" (
	"email"	TEXT NOT NULL UNIQUE,
	"profilePicture"	TEXT NOT NULL,
	"name"	TEXT NOT NULL,
	"accessToken"	TEXT NOT NULL,
	"refreshToken"	TEXT NOT NULL,
	"tokenType"	TEXT NOT NULL,
	"expiryTimestamp"	INTEGER NOT NULL,
	"removalTimestamp"	INTEGER NOT NULL,
	PRIMARY KEY("email")
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
DROP TABLE "google"