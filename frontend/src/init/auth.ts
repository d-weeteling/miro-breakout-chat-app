import type { AuthSettings } from "../chat/interfaces/chat"

let authSettings: AuthSettings|undefined
let triedGettingAuthSettings: boolean = false

const getCurrentUserName = async () => {

	const id = await miro.currentUser.getId()
	// @ts-ignore
	const onlineUsers = await miro.board.getOnlineUsers()

	return onlineUsers.find((user) => user.id === id)?.name
}

const __getAuthSettings = async (): Promise<AuthSettings|undefined> => {
	const username = await getCurrentUserName()
	const token = await miro.getToken()
	const boardInfo = await miro.board.info.get()
	const currentBoardPermissions = boardInfo.currentUserPermissions

	// Somewhat debatable mapping from 'currentBoardPermissions' to 'user may
	// use the chat functionality': I've decided that at least one of the
	// following three board permissions needs to be set: "EDIT_INFO",
	// "EDIT_CONTENT", "EDIT_COMMENTS". NB! Decide with the rest of the team
	// whether this is strict enough.
	//
	// Since the local var currentBoardPermissions is typed (SDK.BoardPermission[]),
	// it's implied that if it's length is greater than 0, at least one of the
	// three permissions is set. Therefore, checking can be done easy like this:
	const userMayEdit = currentBoardPermissions.length > 0

	if (username && token && boardInfo.id && userMayEdit)
		return {
			username,
			token,
			boardId: boardInfo.id,
			mayReadWriteBoard: true
		}
}

export const getAuthSettings = async (): Promise<AuthSettings|undefined>  => {
	if (triedGettingAuthSettings)
		return authSettings

	authSettings = await __getAuthSettings()
	triedGettingAuthSettings = true
	return authSettings
}
