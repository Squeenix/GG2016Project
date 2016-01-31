//This is a singleton

var PacketTypes = {
	CHATMESSAGEPACKETID: 1,
	SPAWNPACKETID: 2,
	ENDGAMEPACKETID: 3,
	DIEDPACKETID: 4,
	PLAYERUPDATEPACKETID: 5,
	BULLETSPAWNPACKETID: 6,
	SERVERUPDATEPACKETID: 6,

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

	PlayerUpdatePacket:  function(playerID, x, model, y, rotation, gunOut){
		this.id = 5
		this.playerID = playerID;
		this.model = model;
		this.x = x;
		this.y = y;
		this.rotation = rotation;
		this.gunOut = gunOut;
	},
	
	/** Client individually handles bullet physics once the bullet is shot */
	BulletSpawnPacket: function(entityID, x, y, xVel, yVel){
		this.id = 6;
	},

	ServerUpdatePacket:  function(x, y, model, rotation, gunOut){
		this.id = 7;
		this.model = model;
		this.x = x;
		this.y = y;
		this.rotation = rotation;
		this.gunOut = gunOut;
	},
	
};