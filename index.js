var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/www/index.html');
});

app.get('/assets/snaketile.png', function(req, res){
  res.sendFile(__dirname + '/www/assets/snaketile.png');
});

app.get('/js/phaser.min.js', function(req, res){
  res.sendFile(__dirname + '/www/js/phaser.min.js');
});

var clients = [];
var pos = [];
var snackpos = [];
var leaderboard = [];
var kills = [];
var sock_map = [];
var color = 0;

io.on('connection', function(socket){
	var tempsend = [];
	clients.push(socket);
	console.log(socket.id +' connected');
	
	tempsend.push(socket.id);
	tempsend.push(color);
	
	color++;
	if (color == 3) color = 0;
	
	socket.emit('init', tempsend);
	
	sock_map[socket.id] = clients.indexOf(socket);
	kills[clients.indexOf(socket)] = 0;
	
	socket.on('update', function(msg){
		msg['kills'] = kills[clients.indexOf(socket)];
		pos[clients.indexOf(socket)] = msg;
		
		io.emit('update', pos);
	});
	
	socket.on('disconnect', function() {
		pos.splice(clients.indexOf(socket), 1);
		clients.splice(clients.indexOf(socket), 1);
	});
	
	socket.on('drop_snack', function(dirmap) {
		dropSnack(dirmap);
		console.log(snackpos);
		io.emit('drop_snack', snackpos);
		
	});
	
	socket.on('kill', function(data) {
		kills[sock_map[data[1]]]++;
		io.to(data[1]).emit('kill');
	});
	
	socket.on('end_game', function() {
		var send = [];
		send[pos[clients.indexOf(socket)].playerName] = pos[clients.indexOf(socket)].len;
		leaderboard.push(send);
		
		var sort_lead = [];
		
		for (var name in leaderboard)
			sort_lead.push([Object.keys(leaderboard[name])[0], leaderboard[name][Object.keys(leaderboard[name])[0]]]);
		
		sort_lead.sort(sortNumber);
		
		var i = 0;
		send = [];
		sort_lead.forEach(function(element) {
				send[i] = [];
				send[i][0] = element[Object.keys(element)[0]];
				send[i][1] = element[Object.keys(element)[1]];
				i++;
		});
		
		io.emit('lead_update', send);
	});
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function dropSnack(dirmap) {
	var randx = Math.floor((Math.random()*dirmap[2]));
	var randy = Math.floor((Math.random()*dirmap[3]));
	
	var tag = randx+"+"+randy;
	var	tmpidx = dirmap[1][tag];
	
	if (typeof dirmap[0] == 'array') {
		dirmap[0].foreach(function(element) {
			if (element.dir.indexOf(tmpidx) > 0) {
				dropSnack(dirmap);
			}
		});
	}
	
	if (randx == 0 || randy == 0 || randx == (dirmap[2] - 1) || randy == (dirmap[3] - 1)) {
		dropSnack(dirmap);
	} else {
		snackpos = {
			x: randx,
			y: randy
		}
	}
}

function sortNumber(a,b) {
    //return a[1] + b[1];
    if (a[1] === b[1]) {
	    return 0;
    } else {
	    return (a[1] < b[1]) ? 1 : -1;
    }
}
