import {
	DatabaseGoogleUserSchema,
	type DatabaseGoogleUser,
} from "@impoexpo/shared";
import { db } from "../../db";
import { parse } from "valibot";

export const saveUserInformation = (user: DatabaseGoogleUser) => {
	const statement = db.prepare(
		"INSERT INTO google (email, profilePicture, name, accessToken, refreshToken, tokenType, expiryTimestamp, removalTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
	);
	statement.run(
		user.email,
		user.profilePicture,
		user.name,
		user.accessToken,
		user.refreshToken,
		user.tokenType,
		user.expiryTimestamp,
		user.removalTimestamp,
	);
};

export const getByAccessToken = (token: string) => {
	const statement = db
		.prepare("SELECT * FROM google WHERE accessToken = ?")
		.bind(token);
	console.log(parse(DatabaseGoogleUserSchema, statement.get()));
};
