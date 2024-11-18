import { PrismaClient } from '@prisma/client'

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