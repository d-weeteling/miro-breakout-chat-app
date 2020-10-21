var express = require('express')
var app = express()
var cors = require('cors')
var http = require('http').Server(app)
var socketConfig = require('./config')
var io = require('socket.io')(http, socketConfig)
var port = process.env.PORT || 8081

var rooms = {} // key=roomId; value={socketId: socketObject}
var roomsCreatedAt = new WeakMap()
var names = new WeakMap()
var roomId
var name

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

		// Delete the specific socket from the room:
		delete rooms[roomId][socket.id]

		// If no more users are connected, delete the room:
		const room = rooms[roomId]
		if (!Object.keys(room).length) {
			delete rooms[roomId]
		}
	})
})

http.listen(port, '0.0.0.0', () => {
	console.log('listening on *:' + port)
})
