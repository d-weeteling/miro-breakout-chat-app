var express = require('express')
var fetch = require("node-fetch");

var app = express()
var cors = require('cors')
var http = require('http').Server(app)
var socketConfig = require('./config')
var io = require('socket.io')(http, socketConfig)
var port = process.env.PORT || 8081


var rooms = {} // NB! This Object looks like: key => roomId; value => {socketId: socketObject}
var roomsCreatedAt = new WeakMap()
var names = new WeakMap()
var roomId
var name

async function validate(boardId, token) {
	const url = `https://api.miro.com/v1/boards/${boardId}`
	const response = await fetch(url, {headers: {Authorization: `Bearer ${token}`}})

	// If the user is now allowed to fetch the board data, return false:
	if(response.statusText !== 'OK')
		return false

	// Available roles: viewer, commenter, editor, owner. I presume only viewer
	// has a read-only role. Check whether the user has a different role than viewer:
	const role = (await response.json()).currentUserConnection.role.toLowerCase()
	return role !== 'viewer'
}

function getClientName(socket) {
	var author = names.get(socket)
	if (author) return author
	console.error('[ERROR] Cannot find clientName for socket with id: ' + socket.id)
	return 'Unknown name'
}

app.use(cors())

app.get('/rooms/:roomId', (req, res) => {
	const {roomId} = req.params
	const room = rooms[roomId]

	if (room) {
		res.json({
			createdAt: roomsCreatedAt.get(room),
			users: Object.values(room).map(getClientName),
		})
	} else {
		res.status(500).end()
	}
})

app.get('/rooms', (req, res) => {
	res.json(Object.keys(rooms))
})

io.use(async (socket, next) => {
	const { boardId, token } = socket.handshake.query
	console.log(`A new connection was made for board: ${boardId}`)
	console.log(`The user has token: ${token}`)
	if (await validate(boardId, token)) {
		console.log('=> Token validated? YES')
		next()
	} else {
		console.log('=> Token validated? NO')
		next(new Error('Invalid token/boardId combination!'))
	}
})

io.on('connection', (socket) => {
	socket.on('join', (_roomId, _name, callback) => {
		if (!_roomId || !_name) {
			if (callback) {
				callback('roomId and name params required')
			}
			console.warn(`${socket.id} attempting to connect without roomId or name`, {roomId, name})
			return
		}

		roomId = _roomId
		name = _name

		if (rooms[roomId]) {
			rooms[roomId][socket.id] = socket
		} else {
			rooms[roomId] = {[socket.id]: socket}
			roomsCreatedAt.set(rooms[roomId], new Date())
		}
		socket.join(roomId)

		names.set(socket, name)

		io.to(roomId).emit('system message', `${name} joined ${roomId}`)

		if (callback) {
			callback(null, {success: true})
		}
	})

	socket.on('chat message', (msg) => {
		io.to(roomId).emit('chat message', msg, getClientName(socket))
	})

	socket.on('disconnect', () => {
		io.to(roomId).emit('system message', `${getClientName(socket)} left ${roomId}`)

		delete rooms[roomId][socket.id]
		const room = rooms[roomId]
		if (!Object.keys(room).length) {
			delete rooms[roomId]
		}
	})
})

http.listen(port, '0.0.0.0', () => {
	console.log('listening on *:' + port)
})
