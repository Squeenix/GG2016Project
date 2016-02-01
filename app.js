var spawnPointList = [{x: 500, y:500}, 
					  {x: 1000, y:1000},
					  {x: 1000, y:1000},
					  {x: 1000, y:1000},
					  {x: 1000, y:1000},
					  {x: 1000, y:1000},
					  {x: 1000, y:1000},
					  {x: 1000, y:1000}];


String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
}


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
	socket.on('gameSocket', function(packet){
		handlePacket(socket, packet);
	});

	socket.on('disconnect', function(){
    	userDisconnected(socket);
  });
});

server.listen(3000, function() { 
	console.log('Listening of port 3000');
});

//This is a singleton

var PacketTypes = {
	CHATMESSAGEPACKETID: 1,
	SPAWNPACKETID: 2,
	ENDGAMEPACKETID: 3,
	DIEDPACKETID: 4,
	PLAYERUPDATEPACKETID: 5,
	BULLETSPAWNPACKETID: 6,
	SERVERUPDATEPACKETID: 7,
	WANTTOPLAYPACKETID: 8,
	TOSERVERCHATPACKETID: 9,
	FAKEBULLETSPAWNPACKETID: 10,

	/** Two way client -> server and server -> client */
	ChatMessagePacket: function(sender, message){
		this.id = 1;
		this.sender = sender;
		this.message = message;

	},

	/** Server - > Client.  Defined in client for convenience */
	StartingPacket: function(yourID, users){
		this.id = 2;
		this.yourID = yourID;
		this.users = users;
	},

	EndGamePacket: function(){
		this.id = 3;

	},

	/** Client -> Server.  Server simply relays these until it notices all the players are dead
		and then goes back into waiting phase. */
	 DiedPacket: function(reason, entityID){
		this.id = 4;
		this.reason = reason;
		this.killedEntityID = killedEntityID;
		//This should really be resolved on the server side but is a function of my laziness
	},

	PlayerUpdatePacket:  function(playerID, x, y, model, rotation, hasGun, isDead){
		this.id = 5
		this.playerID = playerID;
		this.model = model;
		this.x = x;
		this.y = y;
		this.rotation = rotation;
		this.hasGun = hasGun;
		this.isDead = isDead;
	},
	
	/** Client individually handles bullet physics once the bullet is shot */
	BulletSpawnPacket: function(x, y, xVel, yVel){
		this.id = 6;
		this.x = x;
		this.y = y;
		this.xVel = xVel;
		this.yVel = yVel;
	},

	// Client -> Server
	ServerUpdatePacket:  function(x, y, model, rotation, hasGun, isDead){
		this.id = 7;
		this.model = model;
		this.x = x;
		this.y = y;
		this.rotation = rotation;
		this.hasGun = hasGun;
	},

	WantToPlayPacket: function(){
		this.id = 8;
	},

	ToServerChatPacket: function(message){
		this.id = 9;
		this.message = message;
	},

	FakeBulletSpawnPacket: function(entityID, x, y, xVel, yVel){
		this.id = 10;
		this.x = x;
		this.y = y;
		this.xVel = xVel;
		this.yVel = yVel;
	},
};

var DIRECTIONAL_MESSAGE_RADIUS = 375;
var FAR_MESSAGE_RADIUS = 1500;

var WAITING_STAGE = 10001;
var PLAYING_STAGE = 10002;
var currentStage = WAITING_STAGE;

var Factions = {
	TERRORIST: {id: 100001, name: "Terrorist", description: "Your objective is to have 3 people dead (not including yourself).  You have a gun that you can unholster by pressing 'x'.  You may also type /bomb after 10 minutes to activate a time bomb on a 3 minute timer."},
	POLICEMAN: {id: 100002, name: "Policeman", description: "Your objective is to ensure only at most one judge/civilian dies per round.  You can swap places with a user one time per map for 30 seconds by typing /swap [name] (10 second warmup).  You can still win if you die."},
	CIVILIAN: {id: 100003, name: "Civilian", description: "You have no special powers.  Survive for 20 minutes."},
	JUDGE: {id: 100004, name: "Judge", description: "Your objective is to kill the terrorist.  You have a gun which you can unholster by pressing 'x"},
	MAFIA: {id: 100005, name: "Mafia", description: "Your objective is to kill the policeman and to stay alive.  You have a BB gun you can unholster to by pressing 'x', which does no damage.  You can type /imitate once per game to imitate someone for 30 seconds."},
};

var PLAYER_NAMES = ["", "LIGHT BLUE", "TAN", "BLACK", "ROBO", "GREEN", "NAVY"];

var userList = [];

var neededPlayers = 6;


/** Socket IO Stuff Handling **/

function handlePacket(socket, packet){
	switch(packet.id){
		case PacketTypes.CHATMESSAGEPACKETID: 
			break; 

		case PacketTypes.SPAWNPACKETID: 
			break;

		case PacketTypes.ENDGAMEPACKETID:
			break;

		//Inform clients that someone died
		case PacketTypes.DIEDPACKETID:

			break;

		case PacketTypes.PLAYERUPDATEPACKETID:
		break;


		//Inform cliets that bullets were spawned
		case PacketTypes.BULLETSPAWNPACKETID:
			console.log("recieved shot packet");
			for(var i = 0; i < userList.length; i++){
				var curSocket = userList[i].socket;
				if(curSocket.id != socket.id){
					sendPacket(socket, packet);
				}
			}
			break; //handle later

		case PacketTypes.SERVERUPDATEPACKETID:
			for(var i = 0; i < userList.length; i++){
				var user = userList[i];
				if(user.socket.id == socket.id){
					updatePlayerDataAndRelay(user,packet);
					break;
				}
			}	
			break; //handle later

		case PacketTypes.WANTTOPLAYPACKETID:
			userTriesToJoin(socket);
		break; //handle later

		case PacketTypes.TOSERVERCHATPACKETID:

			var msg = String(packet.message);

			console.log("MESSAGE: " + msg);

			if(msg == ""){
				return;
			}
 
			if(msg.startsWith("/")){
				serverHandleMessage(msg, socket);
			}
			else{
				relayMessage(msg, socket);
			}
		break;

		case PacketTypes.FAKEBULLETSPAWNPACKETID:
			for(var i = 0; i < userList.length; i++){
				var curSocket = userList[i].socket;
				if(curSocket && curSocket.id != socket.id){
					sendPacket(socket, packet);
				}
			}
		break;

		default: return;
	}
}

//Sends to a single user
function sendServerMessage(userid, message){
	var userSocket;
	for(var i = 0; i < userList.length; i++){
		if(userList[i].id === userid){
			userSocket = userList[i].socket;
		}
	}
	if(userSocket){
		var messagePacket = new PacketTypes.ChatMessagePacket("SERVER", message);
		sendPacket(userSocket, messagePacket);
	}
}

//Sends to all connected users
function sendServerMessageGlobal(message){
	for(var i = 0; i < userList.length; i++){
		sendServerMessage(userList[i].id, message);
	}
}

/* Handles commands from user */
function serverHandleMessage(message, socket){
	if(currentStage === WAITING_STAGE){
		return; // Nothing to do involving commands in the waiting room
	}
	else if(currentStage === PLAYING_STAGE){
		var command = message.substring(1);

	}
}

/* Relays the message to everyone if you're in the pregame lobby, and to everyone 
within DIRECTIONAL_MESSAGE RADIUS otherwise */
function relayMessage(message, socket){
	var user;
	for(var i = 0; i< userList.length; i++){
		if(socket.id === userList[i].socket.id){
			user = userList[i];
		}
	}

	if(!user){
		return;
	}


	if(currentStage === WAITING_STAGE){
		for(var i = 0; i < userList.length; i++){
			var messagePacket = new PacketTypes.ChatMessagePacket("PLAYER", message);
			sendPacket(userList[i].socket, messagePacket);
		}
	}

	else if(currentStage === PLAYING_STAGE){
		if(user.player.isDead){
			sendServerMessage(user.id, "Dead people can't speak!");
			return;
		}
		for(var i = 0; i < userList.length; i++){
			var far = message.startsWith("!");
			var otherUser = userList[i];

			var player = user.player;
			var otherPlayer = otherUser.player;

			var xDiff = player.x - otherPlayer.x;
			var yDiff = player.y - otherPlayer.y;

			var distance = Math.sqrt(xDiff * xDiff + yDiff + yDiff);

			if(far && (distance < FAR_MESSAGE_RADIUS) || (distance < DIRECTIONAL_MESSAGE_RADIUS)){

				var messagePacket = new PacketTypes.ChatMessagePacket(PLAYER_NAMES[player.model], message);
				sendPacket(userList[i].socket, messagePacket);
			}
		}
	}
}

function updatePlayerDataAndRelay(user, packet){
	var player = user.player;
	player.model = packet.model;
	player.x = packet.x;
	player.y = packet.y;
	player.rotation = packet.rotation;
	player.hasGun = packet.hasGun;
	player.isDead = packet.isDead;

	//Relay to all clients
	for(var i = 0; i < userList.length; i++){
		if(userList[i].id != user.id){
			sendUpdatedUserData(user, userList[i]);
		}
	}
}

function sendUpdatedUserData(aboutUser, toUser){
	var player = aboutUser.player;
	var updatePacket = new PacketTypes.PlayerUpdatePacket(aboutUser.id, player.x, player.y, player.model, player.rotation, player.hasGun, player.isDead);
	sendPacket(toUser.socket, updatePacket);
}

function sendPacket(socket, packet){
	socket.emit("gameSocket", packet);
}

/** User object constructor */
function User(id, socket){
	this.id = id;
	this.socket = socket;
	this.player = 0;
}

User.prototype.setPlayer = function(player){
	this.player = player;
}

/* Player is a child of user that contains the information
 * about the character's state */
function Player(faction, model, isDead, hasGun, x, y, rotation){
	this.faction = faction
	this.model = model;
	this.isDead  = isDead;
	this.hasGun = hasGun;
	this.x = x;
	this.y = y;
	this.rotation = rotation;
}


function userConnected(socket){
	var generatedID;
	var duplicate = false;
	
	//Generate unique id for each user.
	do {
		generatedID = Math.floor(Math.random() * (200000 - 100000) + 100000);
		for(var i = 0; i < userList.length; i++){
			if(userList[i].id === generatedID){
				duplicate = true;
				break;
			}
		}
	} while(duplicate);

	userList.push(new User(generatedID, socket));
	sendServerMessage(generatedID, "welcome!  There are currently " + userList.length + "/" + neededPlayers + " players connected");
	console.log("User connected, assigned ID of " + generatedID);
	console.log(userList.length + "/" + neededPlayers + " connected");

	tryToStartGame()

}

/** Removes the user from the list of users */
function userDisconnected(socket){
	for(var i = 0; i < userList.length; i++){
		if(userList[i].socket === socket){
			//Remove the item from the arraylist
    		userList.splice(i, 1);
		}
	}
	socket.disconnect();

	console.log("User disconnected");
	console.log(userList.length + "/" + neededPlayers + " connected");

	//Notify users when someoone has disconnected.
	if(currentStage === PLAYING_STAGE){
		var user;
		for(var i = 0; i < userList.length; i++){
			if(userList[i].socket === socket.id){
				user = userList[i];
			}
		}
		if(user){
			sendServerMessageGlobal(PLAYER_NAMES[user.player.model] + "has disconnected. (S)he was the" + getFactionName[user.player.faction]);
		}
	}

	if(userList.length === 0 && currentStage === PLAYING_STAGE){
		console.log("All users disconnected.  Resetting");
		resetGame();
	}
}

/* Resets all variables to default state (this is why you don't use globals) */
function resetGame(){
	for(var i = 0; i < spawnPointList.length; i++){
		SpawnPointList[i].used = false;
	}
	for(var i = 0; i < userList.length; i++){
		userList[i].user = false;
	}
}

/* Starts game if you have enough players */
function tryToStartGame(){
	if(userList.length === neededPlayers){
		startGame();
	}
}

/* Starts the game and sends out packets to all the players that it has started */
function startGame(){
	console.log("Starting game");
	sendServerMessageGlobal("The game has started.");

	currentStage = PLAYING_STAGE;

	generateUserPlayers();
	sendOutSpawnPackets();
}

function sendOutSpawnPackets(){
	var userDataList = [];
	for(var i = 0; i < userList.length; i++){
		userDataList.push({playerID: userList[i].id, 
						   model: userList[i].player.model,
						   isDead: userList[i].player.isDead,
						   hasGun: userList[i].player.hasGun,
						   rotation: userList[i].player.rotation,
						   faction: userList[i].player.faction,
						   x: userList[i].player.x, 
						   y: userList[i].player.y
		});
	}

	for(var i = 0; i < userList.length; i++){
		var curID = userList[i].id;
		var initPacket = { id: PacketTypes.SPAWNPACKETID,
						   yourID: curID,
					   	   users: userDataList};

		var curFaction = userList[i].player.faction;

		//Send description of user's faction to them
		var factionName = getFactionName(curFaction);
		var factionDescription = getFactionDescription(curFaction);

		sendServerMessage(curID, "You are a " + factionName + ". " + factionDescription + ". Good luck.");
		sendPacket(userList[i].socket, initPacket);
	}
}


/* Called to give all the players rotation/location/state data */
function generateUserPlayers(){
	var randomFaction = shuffleArray([Factions.TERRORIST, Factions.POLICEMAN, Factions.CIVILIAN, Factions.CIVILIAN, Factions.JUDGE, Factions.MAFIA]);
	var randomSpawnPoints = shuffleArray(spawnPointList);
	var randomModel = shuffleArray([1,2,3,4,5,6]);

	for(var i = 0; i < userList.length; i++){
		var curPlayer = new Player(randomFaction[i].id, randomModel[i], false, false, randomSpawnPoints[i].x, randomSpawnPoints[i].y, 90);
		userList[i].player = curPlayer;
	}
}

//Determines if anyone has won.  If everyone either met their victory conditions or is dead, the condition is impoosible, or is dead then the game is over.
function hasAnyoneWon(){
	var timeUp = 0;

	var numTerroristsDead = 0;
	var numJudgesDead = 0;
	var numCivsDead = 0;
	var numMafiaDead = 0;
	var numPoliceDead = 0;
	for(var i = 0; i < userList.length; i++){
		if(user[i].player.faction === Factions.JUDGE){
			numJudgesDead++;
		}
		else if(user[i].player.faction === Factions.MAFIA){
			numMafiaDead++;
		}
		else if(user[i].player.faction === Factions.TERRORIST){
			numTerroristsDead++;
		}
		else if(user[i].player.faction === Factions.CIVILIAN){
			numCivsDead++;
		}
		else if(user[i].player.faction === Factions.POLICEMAN){
			numPoliceDead++;
		}
	}
	
	//var judgewin = numTerroristsDead === 1;
	//var judgeDoomed = numJudgesDead === 1;

	//var mafiawin = numPoliceDead === 1 && alive && (timeUp || numTerroristsDead === 1 );
	//var mafiaDoomed = numTerroristsDead === 1 && numberPoliceDead === 1;

	//var civWin = alive && (timeUp || terroristDead);
	//var civDoomed = dead;

	//var policeWin = numCivsDead && numJudgesDead <2 && (timeUp || terroristDead);
	//var policeDoomed = numCivsDead && numJudgesDead > 2;

	//var terroristWin = numJudgesDead + numCivsDead + numPoliceDead + numMafiaDead > 2
	//var terroristDoomed = numJudgesDead + numCivsDead + numPoliceDead + numMafiaDead < 3 && numTerroristsDead ===1
}

function userTriesToJoin(socket){
	if(currentStage === PLAYING_STAGE){
		console.log("User tried to join a game in progress!");
	}
	else{
		userConnected(socket);
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

function getFactionName(factionID){
	switch(factionID){
		case Factions.TERRORIST.id: return Factions.TERRORIST.name; 
		case Factions.POLICEMAN.id: return Factions.POLICEMAN.name;
		case Factions.CIVILIAN.id: return Factions.CIVILIAN.name;
		case Factions.MAFIA.id: return Factions.MAFIA.name;
		case Factions.JUDGE.id: return Factions.JUDGE.name;
		default: return "UNDEFINED FACTION";
	}
}

function getFactionDescription(factionID){
	switch(factionID){
		case Factions.TERRORIST.id: return Factions.TERRORIST.description; 
		case Factions.POLICEMAN.id: return Factions.POLICEMAN.description;
		case Factions.CIVILIAN.id: return Factions.CIVILIAN.description;
		case Factions.MAFIA.id: return Factions.MAFIA.description;
		case Factions.JUDGE.id: return Factions.JUDGE.description;
		default: return "UNDEFINED FACTION DESCRIPTION";
	}
}