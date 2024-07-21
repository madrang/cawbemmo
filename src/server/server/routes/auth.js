const bcrypt = require("bcrypt-nodejs");

const express = require("express");

const util = require("util");
const bCompare = util.promisify(bcrypt.compare);

const jwt = require("jsonwebtoken");

const createRouter = (options) => {
	const jwtSecret = options?.secret || require("crypto").randomBytes(35).toString("hex");
	if (typeof jwtSecret !== "string") {
		throw new Error("options.secret must be a string.");
	}
	const router = express.Router();
	router.route("/login").post(async (req, res, next) => {
		const { username, password } = req.body
		if (!username || !password) {
			return res.status(400).json({
				message: "Login not successful"
				, error: "Username or Password not present"
			});
		}
		try {
			const storedPassword = await io.getAsync({
				key: username
				, table: "login"
				, noParse: true
			});
			if (!storedPassword) {
				res.status(401).json({
					message: "Login not successful"
					, error: "User not found"
				});
			}
			const compareResult = await bCompare(password, storedPassword);
			if (!compareResult) {
				res.status(401).json({
					message: "Login not successful"
					, error: "User not found"
				});
			} else {
				const accountInfo = await io.getAsync({
					key: username
					, table: "accountInfo"
					, noDefault: true
				}) || {
					loginStreak: 0
					, level: 0
				};
				const maxAge = 3 * 60 * 60;
				const token = jwt.sign(
					{
						username
						, level: accountInfo.level
					}
					, jwtSecret
					, {
						// 3hrs in sec
						expiresIn: maxAge
					}
				);
				res.cookie("jwt", token, {
					// Flags the cookie to be accessible only by the web server.
					httpOnly: true
					// 3hrs in ms
					, maxAge: maxAge * 1000
				});
				res.status(200).json({
					message: "Login successful"
					, user: {
						username
						, ...accountInfo
						, jwt: token
					}
				});
			}
		} catch (err) {
			return res.status(400).json({
				message: "An error occurred"
				, error: err.message
			});
		}
	});

	router.route("/register").post(async (req, res, next) => {
		const { username, password } = req.body
		if (!username || !password) {
			return res.status(400).json({
				message: "Username or Password not present"
			})
		}
		if (password.length < 6) {
			return res.status(400).json({ message: "Password less than 6 characters" })
		}
		try {
			await User.create({
				username,
				password,
			}).then(user =>
				res.status(200).json({
					message: "User successfully created"
					, user
				})
			);
		} catch (err) {
			res.status(401).json({
				message: "User not successful created"
				, error: err.mesage
			})
		}
	});
	return router;
};

const createAuth = (reqLevel) => {
	return (req, res, next) => {
		const token = req.cookies.jwt
		if (!token) {
			return res.status(401).json({ message: "Not authorized, jwt token not available" });
		}
		jwt.verify(token, jwtSecret, (err, decodedToken) => {
			if (err) {
				return res.status(401).json({ message: "Not authorized" });
			}
			if (decodedToken.level < reqLevel) {
				return res.status(401).json({ message: "Not authorized" });
			}
			next();
		});
	}
};

module.exports = {
	createRouter
	, createAuth
};
