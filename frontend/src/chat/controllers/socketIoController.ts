import io from 'socket.io-client'

import {CHAT_HOST, CHAT_OPTIONS} from '../../config'

import type {ChatSettings, ChatController} from '../interfaces/chat'

const initChat = ({ roomId, authSettings, messageHandler }: ChatSettings) => {
	const { username, token, boardId } = authSettings
	const options = { ...CHAT_OPTIONS, query: { token, boardId }}
	const socket = io(CHAT_HOST, options)

	socket.emit('join', roomId, username, () => {})

	socket.on('chat message', messageHandler)

	return {
		sendMessage: (msg: string) => {
			socket.emit('chat message', msg, () => {})
		},
	} as ChatController
}

export default initChat
