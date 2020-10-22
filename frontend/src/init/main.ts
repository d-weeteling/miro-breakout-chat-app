import type { AuthSettings } from '../chat/interfaces/chat'
import {CLIENT_ID} from '../config'
import appIcon from './icon'

export let authSettings: AuthSettings| undefined

const initChat = (breakoutChatRoomId: string) => {
	miro.__setRuntimeState({
		[CLIENT_ID]: {
			breakoutChatRoomId,
		},
	})

	miro.board.ui.closeLeftSidebar()
	miro.board.ui.openLeftSidebar('/chat')
}

const handleAddChatClick = async () => {
	const viewport = await miro.board.viewport.get()

	const widget = (
		await miro.board.widgets.create({
			type: 'SHAPE',
			text: 'click to join a breakout chat',
			width: 300,
			style: {
				shapeType: 6,
				backgroundColor: '#fff',
				fontFamily: miro.enums.fontFamily.PERMANENT_MARKER,
				borderWidth: 7,
			},
			metadata: {
				[CLIENT_ID]: {
					isBreakoutChatButton: true,
				},
			},
			x: viewport.x + viewport.width / 2,
			y: viewport.y + viewport.height / 2,
		})
	)[0]

	// @ts-ignore
	miro.board.viewport.zoomToObject(widget)

	initChat(widget.id)
}

const initPlugin = async () => {
	authSettings = await getAuthSettings()
	if (!authSettings) return
	// @ts-ignore
	miro.addListener(miro.enums.event.SELECTION_UPDATED, async () => {
		const widgets = await miro.board.selection.get()
		if (widgets.length === 1 && widgets[0].metadata[CLIENT_ID]?.isBreakoutChatButton) {
			initChat(widgets[0].id)
		}
	})

	await miro.initialize({
		extensionPoints: {
			bottomBar: {
				title: 'Create a new breakout chat',
				svgIcon: appIcon,
				onClick: handleAddChatClick,
			},
		},
	})
}

const getCurrentUserName = async () => {
	const id = await miro.currentUser.getId()
	// @ts-ignore
	const onlineUsers = await miro.board.getOnlineUsers()

	return onlineUsers.find((user) => user.id === id)?.name
}

const getAuthSettings = async (): Promise<AuthSettings | undefined> => {
	const username = await getCurrentUserName()
	const token = await miro.getToken()
	const boardInfo = await miro.board.info.get()
	const currentBoardPermissions = boardInfo.currentUserPermissions

	// Somewhat debatable mapping from 'currentBoardPermissions' to 'user may
	// use the chat functionality': I've decided that at least one of the
	// following three board permissions needs to be set: "EDIT_INFO",
	// "EDIT_CONTENT", "EDIT_COMMENTS".
	// NB! Decide with the rest of the team whether this is strict enough.
	const userMayEdit = currentBoardPermissions.indexOf('EDIT_INFO') > - 1
		|| currentBoardPermissions.indexOf('EDIT_CONTENT') > - 1
		|| currentBoardPermissions.indexOf('EDIT_COMMENTS') > - 1

	if (username && token && boardInfo.id && userMayEdit)
		return {
			username,
			token,
			boardId: boardInfo.id,
			mayReadWriteBoard: true
		}
}

miro.onReady(async () => {
	const authorized = await miro.isAuthorized()
	if (authorized) {
		initPlugin()
	} else {
		const res = await miro.board.ui.openModal('not-authorized.html')
		if (res === 'success') {
			initPlugin()
		}
	}
})
