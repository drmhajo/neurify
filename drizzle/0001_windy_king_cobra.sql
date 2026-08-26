CREATE TABLE `devicePushTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` varchar(64) NOT NULL,
	`token` varchar(255) NOT NULL,
	`platform` varchar(16) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devicePushTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `devicePushTokens_token_unique` UNIQUE(`token`)
);
