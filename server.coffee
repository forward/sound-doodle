express = require 'express'
http = require 'http'
path = require 'path'
sys = require 'sys'
fs = require 'fs'

app = express()

app.configure ->
  app.set('port', process.env.PORT || 9292)
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(express.favicon())
  app.use(express.logger('dev'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(path.join(__dirname, 'public')))

app.configure 'development', ->
  app.use express.errorHandler()

server = http.createServer(app).listen app.get('port'), ->
  console.log "Express server listening on port " + app.get('port')


io = require('socket.io').listen(server)
io.set("log level", 1)
io.enable('browser client minification')
io.enable('browser client etag')
io.enable('browser client gzip')
io.set('log level', 1)
io.set 'transports',
[
#    'websocket'
   'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]

io.sockets.on 'connection', (socket) ->
  console.log "#{socket.id} connected"
  client_count++
  socket.emit 'population', population
  socket.emit 'status', status()
  socket.emit 'reset'
  socket.on 'result', (new_population) ->
    #console.log "got result from #{socket.id}"
    result_count++
    #console.log result_count
    if result_count > client_count
      population = for i in [0...200]
        weighted_choice(population)
      io.sockets.emit 'population', population
      io.sockets.emit 'status', status()
      result_count = 0
    update_population(new_population)
  socket.on 'disconnect', ->
    client_count--
    console.log "#{socket.id} left"

app.get '/', (req,res) ->
  res.redirect '/draw'

app.get '/sound', (req,res) ->
  res.render 'sound', title: "Sound"

app.post '/sound/capture/:filename', (req,res) ->
  stream = fs.createWriteStream "./public/#{req.params.filename}.wav"

  req.on 'data', (chunk) ->
    stream.write chunk

  req.on 'end', ->
    stream.end

app.get '/draw', (req, res) ->
  res.render 'draw', title: "Draw"

app.get '/draw2', (req, res) ->
  res.render 'draw2', title: "Draw"

