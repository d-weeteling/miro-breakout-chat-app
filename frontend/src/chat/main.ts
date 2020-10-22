import socketioControllerFactory from './controllers/socketIoController'
import Chat from './components/Chat/Chat.svelte'
import Error from './components/Error.svelte'

import {CLIENT_ID} from '../config'
import type { AuthSettings } from './interfaces/chat'
import { getAuthSettings } from '../init/main'

const initApp = (roomId: string, authSettings: AuthSettings) => {
	new Chat({
		target: document.body,
		props: {
			roomId,
			authSettings,
			chatFactory: socketioControllerFactory,
		},
	})
}

miro.onReady(async () => {
	const authSettings = await getAuthSettings()
	const savedState = await miro.__getRuntimeState()
	if (savedState[CLIENT_ID]?.breakoutChatRoomId && authSettings) {
		initApp(savedState[CLIENT_ID]?.breakoutChatRoomId, authSettings)
	} else {
		new Error({ target: document.body })
	}
})