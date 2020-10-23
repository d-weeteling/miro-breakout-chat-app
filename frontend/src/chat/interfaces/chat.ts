export interface Message {
	text: string
	author: string
	timestamp: Date
	isConsecutive: Boolean,
	userIsAuthor: Boolean
}

export type MessageHandler = (msg: string, name: string) => void

export type EmitHandler = (error: any, response: any) => void

export interface ChatController {
	sendMessage: (msg: string) => void
}

export interface AuthSettings {
	username: string,
	token: string
	boardId: string
	mayReadWriteBoard: boolean
}

export interface ChatSettings {
	roomId: string
	authSettings: AuthSettings
	messageHandler: MessageHandler
}
