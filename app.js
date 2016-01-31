
var express = require("express");
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.use(express.static('public'));

//Basic paths

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + 'public/index.html'));
});

io.on('connection', function(socket){
	console.log('A user connected');
	if(currentStage === PLAYING_STAGE){

	}

	userConnected(socket);
	socket.on('packets', function(packet){
		if(packet.id != PacketTypes.CHATMESSAGEPACKETID){
			socket.disconnect();
			userDisconnected(socket);
		} else {
			handlePacket(socket, packet);
		}

	});

	socket.on('disconnect', function(){
    	userDisconnected(socket);
  });
});

server.listen(3000, function() { 
	console.log('Listening of port 3000');
});

/** Socket IO Stuff Handling **/

function handlePacket(socket, packet){
	
}

function sendPacket(socket, packet){

}

/** Prepare your mind to be blown by the dirtiest code ever made 
	(Horray for accessing globals from callbacks!)**/

/** Also the server is dumb and only really facilitates packet transactions
	Between the clients **/


//only god knows why I have random global variables while everythign else is in a closure.
var WAITING_STAGE = 10001;
var PLAYING_STAGE = 10002;
var currentStage = WAITING_STAGE;

var Factions = {
	TERRORIST: {id: 100001, name: "Terrorist"};
	POLICEMAN: {id: 100002, name: "Policeman"};
	CIVILIAN: {id: 100003, name: "Civilian"};
	JUDGE: {id: 100004, name: "Judge"};
	MAFIA: {id: 100005, name: "Mafia"};
}

var userList = [];

var neededPlayers = 6;

function(){
	var reset;
}

/** User object constructor */
function User(id, socket){
	this.id = id;
	this.socket = socket;
	this.player = 0;
}

User.prototype.setPlayer(player){
	this.player = player;
}

var spawnPointList = [{x: 500, y:500, used: false}, {x: 1000, y:1000, used: false}];

function Player(id, role, model, isDead, gunOut, x, y){
	this.role = role
	this.model = model;
	this.isDead  = isDead;
	this.gunOut = gunOut;
	this.x = x;
	this.y = y;
}

function userConnected(socket){
	var generatedID;
	var duplicate = false;
	
	//Generate unique id for each user.
	do{
		generatedID = Math.floor(Math.random() * (200000 - 100000) + 100000);
		for(var i = 0; i < userList.length; i++){
			if(userList[i].id === generatedID){
				duplicate = true;
				break;
			}
		}
	} while(duplicate);


	console.log("User connected, assigned ID of " + generatedID);

}

function userDisconnected(socket){
	for(var i = 0; i < userList.length; i++){
		if(userList[i].socket == socket){
			//Remove the item from the arraylist
			if (index > -1) {
    			array.splice(index, 1);
			}
		}
	}
//Remove the item from the arraylist}

function resetGame(){
	for(var i = 0; i < spawnPointList.size; i++){
		SpawnPointList[i].used = false;
	}
	for(var i = 0; i < userList.size(); i++){
		userList[i].user = null;
	}
}

function startGame(){
	currentStage = PLAYING_STAGE;

}

function sendOutSpawnPackets(){
	var userDataList = [];
	for(var i = 0; i < users.length; i++){
		usersDataList.add({playerID: userList[i].id, 
						   model: userList[i].player.model,
						   isDead: userList[i].player.isDead,
						   rotation: userList[i].player.rotation,
						   x: userList[i].player.x, 
						   y: userList[i].player.y
						});
	}
	var initPacket = {0, userDataList[]};
	for(var i = 0; i < userList.size(); i++){
		//Array copying hack probably don't need to copy array but I don't have time since socket.io has awful documentation
		var specficiInitPacket = initPacket.slice();
		specficInitPacket.yourID = userList[i].id;
		var socket = userList[i].socket;
		socket.emit("gameSocket", specificInitPacket);
	}
}

function generateUserPlayers(){
	var randomFaction = shuffleArray([Factions.TERRORIST, Factions.POLICEMAN, Factions.CIVILIAN, Factions.CIVILIAN, Factions.JUDGE, Factions.MAFIA]);
	var randomModel = shuffleArray([1,2,3,4,5,6]);
	for(var i = 0; i < userList.size; i++){
		var curPlayer = new Player(randomFaction[i].id, randomModel[i], false, 90, false);
		userList[i].player = curPlayer;
	}
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}