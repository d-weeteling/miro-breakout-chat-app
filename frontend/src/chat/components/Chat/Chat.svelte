<script lang="ts">
	import {onMount} from 'svelte'
	import Message from './Message.svelte'

	import type {
		MessageHandler,
		Message as MessageInterface,
		ChatController,
		ChatSettings,
		AuthSettings,
	} from '../../interfaces/chat'

	export let chatFactory: (settings: ChatSettings) => ChatController
	export let roomId: string
	export let authSettings: AuthSettings

	const { username } = authSettings

	let newMessageText: string = ''

	let chatController: ChatController = null

	let messages: Array<MessageInterface> = []

	$: lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined

	const handleNewMessage: MessageHandler = (text, author) => {
		messages = [...messages, {
			text,
			author,
			timestamp: new Date(),
			isConsecutive: lastMessage?.author === author,
			userIsAuthor: author === username
		}]
	}

	const handleMessageSend = () => {
		if (!newMessageText) return

		chatController.sendMessage(newMessageText)

		newMessageText = ''

		return false
	}

	onMount(() => {
		chatController = chatFactory({roomId, authSettings, messageHandler: handleNewMessage})
	})
</script>

<style>
	.sidebar__container {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
	}

	.sidebar__header {
		padding: 24px;
		height: 64px;
	}

	.sidebar__body {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		height: calc(100% - 120px);
		padding: 0 8px;
	}

	.sidebar__footer {
		padding: 0 8px;
	}

	.sidebar__footer input {
		width: 100%;
	}
</style>

<div class="sidebar__container">
	<div class="sidebar__header">
		<span class="miro-h2">Breakout Chat</span>
	</div>
	<div class="sidebar__body">
		{#each messages as message}
			<Message {message} />
		{/each}
	</div>
	<div class="sidebar__footer">
		<form on:submit|preventDefault={handleMessageSend}>
			<input
				disabled={chatController === null}
				type="text"
				class="miro-input miro-input--primary"
				bind:value={newMessageText}
				placeholder="Type your message here" />
		</form>
	</div>
</div>
