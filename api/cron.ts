import { sendDirectMessage, getPendingReminders, markReminderAsProcessed } from "../lib/db.js";

export default async function handler(req: Request) {
	if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response("Unauthorized", { status: 401 });
	}

	console.log("Running reminder cron job...");
	try {
		const pendingReminders = await getPendingReminders();

		for (const reminder of pendingReminders) {
			await sendDirectMessage(reminder.castId, reminder.userFid, reminder.authorUsername);
			await markReminderAsProcessed(reminder.id);
			console.log(`Processed reminder ${reminder.id} for cast ${reminder.castId}`);
		}

		return new Response("Success", { status: 200 });
	} catch (error) {
		console.error('Error processing reminders:', error);
		return new Response("Error processing reminders", { status: 500 });
	}
}