CREATE TABLE `registrationRequests` (
	`id` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`jobTitle` varchar(160) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` varchar(120),
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrationRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `registrationRequests_email_unique` UNIQUE(`email`)
);
