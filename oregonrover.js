var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var SerialPort = require('serialport');
var app = express();
var debug = require('debug')('selfie:server');
var http = require('http');
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
var server = http.createServer(app);
var io = require('socket.io').listen(server);
//var cors = require('cors');

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/** Event listener for HTTP server "error" event. */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/*** Event listener for HTTP server "listening" event. */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
  
  console.log("Ready: Listening on port "+port);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));//this tells node to look here for static files like pictures and js
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
/*app.use(function(req,res,next) {
	// Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', *);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});*/
var public = path.join(__dirname, 'public/');//Handy absolute path to use with res.sendFile()
//app.use('/static', express.static(__dirname + '/public'));
		
/**************** GET, POST ********************/
app.get('/controller', function(req, res) {
  //res.render('index', { title: 'Express' });
	console.log(req.query);
	res.sendFile(public + 'controller.html');
	//res.sendFile('controller.html');
});
app.get('/', function(req, res) {
  //res.render('index', { title: 'Express' });
	//res.sendFile(path.join(__dirname, 'public/') + 'controller.html');
	res.send("Sup!");
	console.log(req.query);
});
app.post('/command',function(req,res) {
	//console.log("Post");
	var command = req.body.command;
	console.log("Serial Write: " + command );
	writeSerial(command);
	res.json({message: "Response"});
});


/*************************  SOCKET.IO  *******************************/
io.on('connection', function(socket){
	
  	console.log('Socket.IO: User connected');
	
  	socket.on('disconnect', function(){
    	console.log('Socket.IO: User disconnected');
  	});

	socket.on('note', function(msg){
    	//console.log('Socket.IO: ' + msg);
		io.emit('arduino', msg);
  	});
	socket.on('command',function(msg) {
		writeSerial(msg);
	});
	
	socket.on('message',function(msg) {
		//console.log('Socket.IO: ' + msg);
		socket.broadcast.emit('message',msg);
	});
	/*
	socket.on('motor', function(msg) {
		writeSerial(msg);
	});
	socket.on('mouse', function(msg) {
		writeSerial(msg);
	});
	*/
});



/**************** serial ***********************/

var serialPort;

function writeSerial(data) {
	//console.log("Writing " + data);
  if(serialPort && serialPort.isOpen()) {
    serialPort.write(data, function(err) {
      if(err) {
        console.log("Error when writing to serial port: " + err);
      }
    });
  }
  else {
    console.log("Cannot write to serial port: it is not open.");
  }
}

// Using setInterval so the server can try to reestablish a lost connection
setInterval(function() {
  if(!serialPort || !serialPort.isOpen()) {
    SerialPort.list(function(err, ports) {
      if(err) {
        console.log(err);
        return;
      }
      if(ports.length > 0) {
        console.log("Attempt: Trying to connect to " + ports[0].comName);
        // Change the baud rate to your favorite number
        serialPort = new SerialPort(ports[0].comName, { parser: SerialPort.parsers.readline('\n'), baudRate: 9600  }, function(err) {
          if(err) {
            console.log(err);
          }
        });
        
        serialPort.on('open', function() {
          console.log("Success: Serial port opened");
        });
        
        serialPort.on('error', function(err) {
          console.log('Serial port error: ', err.message);
        });
        
        serialPort.on('data', function(data) {
          	console.log("Received: ", data);
			io.emit('arduino', data);
        });
        
        serialPort.on('disconnect', function(err) {
          console.log("Serial port disconnected: ", err.message);
        });
        
        serialPort.on('close', function() {
          console.log('Serial port closed.');
        });
      }
      else {
        console.log("No serial ports available");
      }
    }); 
  }
}, 5000);



module.exports = app;
