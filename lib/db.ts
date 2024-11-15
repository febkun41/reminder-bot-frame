import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient()

export const addReminder = async (castId: string, userFid: string, authorUsername: string, timestamp: number) => {
	console.log("Adding reminder", {castId, userFid, authorUsername, timestamp})

	return prisma.reminder.create({
		data: {
			castId,	
			userFid,
			authorUsername,
			timestamp,
		},
	})
}

export const getPendingReminders = async () => {
	const now = Math.floor(Date.now() / 1000)
	return prisma.reminder.findMany({
		where: {
			timestamp: {
				lte: now,
			},
			processed: false,
		},
	})
}

export const markReminderAsProcessed = async (id: number) => {
	return prisma.reminder.update({
		where: { id },
		data: { processed: true },
	})
}

async function sendDirectMessage(castId: string, userFid: string, authorUsername: string) {
	try {
		const response = await fetch('https://api.warpcast.com/v2/ext-send-direct-cast', {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				recipientFid: userFid,
				message: `🔔 Reminder for cast by @${authorUsername}: https://warpcast.com/${authorUsername}/${castId}`,
				idempotencyKey: uuidv4(),
			}),
		});

		if (!response.ok) {
			console.error(`Failed to send message: ${response.statusText}`);
		}
	} catch (error) {
		console.error('Error sending direct message:', error);
	}
}

export async function startReminderService() {
	console.log('Starting reminder service...');

	// Check for due reminders every minute
	setInterval(async () => {
		console.log("Checking for pending reminders...")
		try {
			const pendingReminders = await getPendingReminders();

			for (const reminder of pendingReminders) {
				await sendDirectMessage(reminder.castId, reminder.userFid, reminder.authorUsername);
				await markReminderAsProcessed(reminder.id);
				console.log(`Processed reminder ${reminder.id} for cast ${reminder.castId}`);
			}
		} catch (error) {
			console.error('Error processing reminders:', error);
		}
	}, 60000); // 60000ms = 1 minute
}