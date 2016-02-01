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