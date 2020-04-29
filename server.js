'use strict'

const express = require('express')
const socketIO = require('socket.io')

const port = process.env.PORT || 3000
const index = '/pictionary.html'

const server = express()
  .use((req, res) => {
    res.sendFile(index, { root: __dirname })
  })
  .listen(port, () => console.log('Listening on port ', port))

const io = socketIO(server)

io.on('connection', (socket) => {
  console.log('A new client joined the server')

  onConnection(socket)
})

let users = []
let currentPlayer = null
let timeout

function onConnection(socket) {
  socket.on('username', (username) => {
    console.log('Client name: ', username)
    socket.username = username

    if (users.length === 0) {
      currentPlayer = socket
      timeout = setTimeout(switchPlayer, 20000)
    }

    users.push(socket)

    sendUsers()
  })

  socket.on('line', (data) => {
    socket.broadcast.emit('line', data)
  })

  socket.on('disconnect', () => {
    users = users.filter((el) => el !== socket)
    sendUsers()
  })
}

function sendUsers() {
  io.emit(
    'users',
    users.map((user) => {
      return { username: user.username, active: user === currentPlayer }
    })
  )
}

function switchPlayer() {
  if (users.length === 0) return

  currentPlayer = users[(users.indexOf(currentPlayer) + 1) % users.length]

  sendUsers()
  timeout = setTimeout(switchPlayer, 20000)

  io.emit('clear')
}
