const express = require('express')
require('dotenv').config()
const morgan = require('morgan')
const cors = require('cors')
const xss = require('xss-clean')
const helmet = require('helmet')
const compression = require('compression')
const bodyParser = require('body-parser')
const socketIo = require('socket.io')
const routerNavigation = require('./routes')

const app = express()
const port = process.env.DB_PORT

// socketio configuration
const server = require('http').createServer(app)
const io = socketIo(server, {
  cors: {
    origin: '*'
  },
  path: '/backend3/socket.io'
})
io.on('connection', (socketIo) => {
  console.log('Socket.io connect')
  socketIo.on('globalMessage', (data) => {
    // global message = pesan yang dikirim ke semua client
    console.log(data)
    io.emit('chatMessage', data)
  })

  socketIo.on('privateMessage', (data) => {
    // private message = pesan yang dikirim ke client saja
    console.log(data)
    socketIo.emit('chatMessage', data)
  })

  socketIo.on('broadCastMessage', (data) => {
    // broadcast message = pesan yang dikirim ke semua client, kecuali diri sendiri
    console.log(data)
    socketIo.broadcast.emit('chatMessage', data)
  })

  // ***
  socketIo.on('joinRoom', (data) => {
    console.log(data)
    if (data.oldRoom) {
      socketIo.leave(data.oldRoom)
    }

    socketIo.join(data.room)
    socketIo.broadcast.to(data.room).emit('chatMessage', {
      userName: 'Bot',
      message: `${data.userName} joined`
    })
  })
  socketIo.on('roomMessage', (data) => {
    io.to(data.room).emit('chatMessage', data)
  })
})

app.use(morgan('dev'))
app.use(cors())
app.options('*', cors())
app.use(xss())
app.use(helmet())
app.use(compression())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
app.use('/backend3/api/v1', routerNavigation)
app.use('/backend3/api', express.static('src/uploads'))

server.listen(port, () => {
  console.log(`Express app is listen on port ${port} !`)
})
