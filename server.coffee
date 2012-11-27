express = require 'express'
http = require 'http'
path = require 'path'
sys = require 'sys'
fs = require 'fs'
uuid = require 'node-uuid'
redis = require 'redis'

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


redishost = "nodejitsudb6041171855.redis.irstack.com"
redishost = "localhost" if process.env.ENV is "development"

app.configure 'development', ->
  app.use express.errorHandler()

app.configure 'production', ->


client = redis.createClient(6379,redishost)
client.auth('nodejitsudb6041171855.redis.irstack.com:f327cfe980c971946e80b8e975fbebb4') unless process.env.ENV is "development"

client.on "error", (err) ->
  console.log("REDIS error: "+ err)

server = http.createServer(app).listen app.get('port'), ->
  console.log "Express server listening on port " + app.get('port')

app.get '/', (req,res) ->
  recentScenes = client.zrevrange "scenes", 0, 8, (err,results) ->
    command = results.map (elem) ->
      ["hget", elem, "screenshot"]
    console.log command
    client.multi(command).exec (err,screenshots) ->
      screenshots = screenshots.map (ss,i) ->
        image: ss
        path: "/play/"+results[i]

      console.log err if err
      res.render 'index',
        title: "Finger Thingy"
        screenshots: screenshots

app.post '/scenes/:id/screenshot', (req, res) ->
  console.log "screenshot!"
  acum = ""
  req.on "data",(chunk) ->
    console.log "chunk"
    acum = acum + chunk
  req.on "end",() ->
    client.hset req.params.id, "screenshot", acum
    res.send 201, "created"

app.get '/scenes/:id', (req,res) ->
  res.setHeader('Content-Type', 'application/json')
  client.hget req.params.id, 'json', (err,json)->
    res.send 200, json

app.post '/scenes/:id', (req,res) ->
  console.log(req.body);
  req.body["timestamp"] = (new Date()).getTime()
  client.hset req.params.id, "json", JSON.stringify(req.body)
  client.zadd "scenes", req.body.timestamp, req.params.id
  res.send(201,"ok")

app.get '/sound', (req,res) ->
  res.render 'sound', title: "Sound"

app.post '/sound/capture/:filename', (req,res) ->
  stream = fs.createWriteStream "./public/#{req.params.filename}.wav"

  req.on 'data', (chunk) ->
    stream.write chunk

  req.on 'end', ->
    stream.end

app.get '/draw', (req, res) ->
  res.render 'draw', title: "Draw", uuid: uuid.v1()

app.get '/play/:id', (req,res) ->
  res.render 'play', title: ("Scene "+req.params.id), id:req.params.id

app.get '/test', (req, res) ->
  res.render 'test', title: "Test", uuid: uuid.v1()
