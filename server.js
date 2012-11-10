// Generated by CoffeeScript 1.3.3
var app, express, http, io, path, server;

express = require('express');

http = require('http');

path = require('path');

app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 9292);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  return app.use(express["static"](path.join(__dirname, 'public')));
});

app.configure('development', function() {
  return app.use(express.errorHandler());
});

server = http.createServer(app).listen(app.get('port'), function() {
  return console.log("Express server listening on port " + app.get('port'));
});

io = require('socket.io').listen(server);

io.set("log level", 1);

io.enable('browser client minification');

io.enable('browser client etag');

io.enable('browser client gzip');

io.set('log level', 1);

io.set('transports', ['flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);

io.sockets.on('connection', function(socket) {
  console.log("" + socket.id + " connected");
  client_count++;
  socket.emit('population', population);
  socket.emit('status', status());
  socket.emit('reset');
  socket.on('result', function(new_population) {
    var i, population, result_count;
    result_count++;
    if (result_count > client_count) {
      population = (function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; _i < 200; i = ++_i) {
          _results.push(weighted_choice(population));
        }
        return _results;
      })();
      io.sockets.emit('population', population);
      io.sockets.emit('status', status());
      result_count = 0;
    }
    return update_population(new_population);
  });
  return socket.on('disconnect', function() {
    client_count--;
    return console.log("" + socket.id + " left");
  });
});

app.get('/', function(req, res) {
  return res.redirect('/draw');
});

app.get('/sound', function(req, res) {
  return res.render('sound', {
    title: "Sound"
  });
});

app.get('/draw', function(req, res) {
  return res.render('draw', {
    title: "Draw"
  });
});
