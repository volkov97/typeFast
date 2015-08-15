var socketio = require('socket.io');

var i_pl = 1, i_rooms = 1,
	namesUsed = [],
	nickNames = {},
	players_av = [],
	rooms = [],
	currentRoom = {},
	points = []; // объект содержит комнаты и очки каждого пользователя в комнате

// Дать игроку имя
function giveDefaultName(socket) {
	var newName = 'Guest ' + i_pl; i_pl++;

	namesUsed.push(newName);
	nickNames[socket.id] = newName;
}

// Сделать id комнаты для парной игры
function makeRoomId() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < 5; i++){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

// Регистрация игрока в системе
function handleJoinGame(socket) {
	socket.on('game random start', function(){

		giveDefaultName(this);	

		players_av.push({
			name: nickNames[this.id],
			id: this.id
		});

		handleChangeSentence(socket);

		if (players_av.length == 2){
			var player1 = players_av.shift();
			var player2 = players_av.shift();

			var roomName = 'room' + i_rooms;
			i_rooms++; rooms.unshift(roomName);

			io.sockets.connected[player1.id].join(roomName);
			io.sockets.connected[player2.id].join(roomName);

			currentRoom[player1.id] = roomName;
			currentRoom[player2.id] = roomName;

			points[roomName] = new Object();

			points[roomName][player1.id] = 0;
			points[roomName][player2.id] = 0;

			io.to(roomName).emit('room created result', roomName, 0);

			startGame(this);
		}	
	});

	socket.on('game pair start', function() {
		giveDefaultName(this);

		var roomName = makeRoomId();
		rooms.unshift(roomName);
		currentRoom[this.id] = roomName;

		points[roomName] = new Object();
		points[roomName][this.id] = 0;

		if (io.sockets.adapter.rooms[roomName]) {
			io.to(this.id).emit('exit room', 'Sorry... Just try again...');
			return;
		}

		io.sockets.connected[this.id].join(roomName);

		io.to(roomName).emit('show room code', roomName);

		handleChangeSentence(socket);
	});

	socket.on('game pair join', function(roomCode) {
		if (Object.keys(io.sockets.adapter.rooms[roomCode]).length == 2) {
			io.to(this.id).emit('exit room', 'This room is full...');
			return;
		}

		giveDefaultName(this);

		io.sockets.connected[this.id].join(roomCode);

		points[roomCode][this.id] = 0;
		currentRoom[this.id] = roomCode;
		
		io.to(roomCode).emit('room created result', roomCode, 1);

		handleChangeSentence(socket);
		startGame(this);
	});
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// использование Math.round() даст неравномерное распределение!
function getRandomInt(min, max) {
  	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function handleChangeSentence(socket) {
	socket.on('show new sentence', function(){
		points[currentRoom[this.id]][this.id] += 10;

		var points1 = points[currentRoom[this.id]][this.id];

		for (var key in points[currentRoom[this.id]]){
			if (key == this.id){
				io.to(key).emit('refresh my points', points1);
			} else{
				io.to(key).emit('refresh opponent points', points1);
			}
		}

		createSentence(this);
	});
}

function createSentence(socket) {
	var sentences = ['sentence1', 'sentence2', 'sentence3', 'русский текст', 'russian text'],
		serverSentence = sentences[getRandomInt(0, sentences.length - 1)];
		
	io.to(currentRoom[socket.id]).emit('show new sentence result', serverSentence);
}

function startGame(socket) {
	createSentence(socket);	
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Функция обработки отключения пользователя
function handleClientDisconnection (socket) {
	socket.on('disconnect', function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		
		if (!currentRoom[socket.id]){
			for (var i = 0; i < players_av.length; i++){
				if (socket.id == players_av[i].id){
					players_av.splice(i, 1);
					break;
				}
			}
		} else{
			var roomName = currentRoom[socket.id];

			for (var key in currentRoom){
				if (currentRoom[key] == roomName && key != socket.id){
					io.to(key).emit('exit room', 'Sorry, but your opponent has left the room...');
				}
			}

			for (var i = 0; i < rooms.length; i++){
				if (roomName == rooms[i]) rooms.splice(i, 1);
			}
		}

		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}

exports.listen = function(server){
	io = socketio.listen(server);

	io.sockets.on('connection', function(socket){
		handleJoinGame(socket);
		handleClientDisconnection(socket);
	});
}