var Factions = {
	TERRORIST: {id: 100001, name: "Terrorist"};
	POLICEMAN: {id: 100002, name: "Policeman"};
	CIVILIAN: {id: 100003, name: "Civilian"};
	JUDGE: {id: 100004, name: "Judge"};
	MAFIA: {id: 100005, name: "Mafia"};
}

var theGame = function(game){
	console.log("Waiting on server to start");
}

/** Handles the custom parameter (spawn packet) which starts the game from the waiting screen */
theGame.prototype.init = function(spawnpacket){
	this.yourID = spawnpacket.yourID;
	this.initPlayerList = spawnpacket.users;
}

theGame.prototype.preload = function(){
	this.wasd = {
		up: game.input.keyboard.addKey(Phaser.Keyboard.W),
		down: game.input.keyboard.addKey(Phaser.Keyboard.S),
		left: game.input.keyboard.addKey(Phaser.Keyboard.A),
		right: game.input.keyboard.addKey(Phaser.Keyboard.D)
	};

	this.otherInputs = {
		x: game.input.keyboard.addKey(Phaser.Keyboard.X)
	};
};

theGame.prototype.create = function() {
	console.log("Starting game");
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //Map setup
	this.map = game.add.tilemap('map');
	this.map.addTilesetImage('spritesheet_tiles', 'tiles');
	this.groundLayer = this.map.createLayer('Floors');


	//Set up all players
	this.otherPlayerList = [];

	for(var i = 0; i < initPlayerList.length; i++){
		if(initPlayerList[i].id === this.yourID){
			var mainCharacterData = this.playerSpriteList[i];
			//Sprite Setup
			this.thePlayer = game.add.sprite(400, 400, getPlayerSkinResource(mainCharacterData.model));
			this.thePlayer.bodyWidth = 20;
			this.thePlayer.bodyHeight = 30;
			this.thePlayer.anchor.setTo(0.5);
		}
		else{
			var playerData = this.playerSpriteList[i];
			var playerSprite = game.add.sprite(playerData.x, playerData.y);
			playerSprite.bodyWidth = 20;
			playerSprite.bodyHeight = 30;
			this.thePlayer.anchor.setTo(0.5);
			this.otherPlayerList.push({data:playerData, sprite:playerSprite, modelUpdated:false});
		}
	}
)

	this.collidableLayer = this.map.createLayer('Collidables');
	this.collidableLayer.resizeWorld();

	//Collision Groups (replace with p2 physics sometime)

	//this.collideBoxes = this.map.createLayer('CollideBoxes');
	//this.collideBoxes.resizeWorld();


	//Keyhandling
	game.input.keyboard.addKey(Phaser.Keyboard.X).onDown.add(theGame.prototype.takeOutGun, this);


	//this.thePlayer.collideWorldBounds = true;
	game.physics.arcade.enable(this.thePlayer);
	game.camera.follow(this.thePlayer);

	//Don't be lazy and go map this shit out so it doesn't look like shit
	//replace with collideboxes when you replace arcade with p2 physics
	this.map.setCollisionBetween(1, 539, true, this.collidableLayer, true);


	//"Game-Specific Settings"
	this.playerHasGunOut = false;
};

theGame.prototype.update = function() {
	game.physics.arcade.collide(this.thePlayer, this.collidableLayer);

	var mouseX = game.input.mousePointer.x;
	var mouseY = game.input.mousePointer.y;
	var centerX = game.width / 2;
	var centerY = game.width / 2;

	/* Move towards the mouse pointer.  Also the characer is centered at the player 
	which is why we can use global window coordinates */


	var vectorX = mouseX - centerX;
	var vectorY = mouseY - centerY;
	var playerAngle = Math.atan2(vectorY, vectorX);

	var inputVelocityX = 0;
	var inputVelocityY = 0;

	if (this.wasd.up.isDown){
        inputVelocityX += vectorX;
        inputVelocityY += vectorY;
    }
    
    if(this.wasd.down.isDown){
    	inputVelocityX -= vectorX;
        inputVelocityY -= vectorY;
    }
    
    if(this.wasd.right.isDown){
    	inputVelocityX += vectorY;
        inputVelocityY -= vectorX;
    }
    
    if(this.wasd.left.isDown){
    	inputVelocityX -= vectorY;
        inputVelocityY += vectorX;
    }
	
	var normalizedInputVelocityX = 0;
	var normalizedInputVelocityY = 0;    

    //Avoid division by zero
    if(inputVelocityX != 0 || inputVelocityY !=0){
	    var magnitude = Math.sqrt(inputVelocityX * inputVelocityX + inputVelocityY * inputVelocityY);

	    normalizedInputVelocityX = inputVelocityX / magnitude;
	    normalizedInputVelocityY = inputVelocityY / magnitude;
	}


    this.thePlayer.body.velocity.x = normalizedInputVelocityX * moveVelocity;
    this.thePlayer.body.velocity.y = normalizedInputVelocityY * moveVelocity;	
   
    this.thePlayer.angle = playerAngle * 57.2958;

};

theGame.prototype.takeOutGun = function(){
	this.thePlayer.loadTexture('p1gun');
	console.log("swapped gun");
	if(this.playerHasGunOut){
		this.playerHasGunOut = false;
	}
	else{
		this.playerHasGunOut = true;
	}

};

theGame.prototype.shoot = function(){
	var bullet = bullets.getFirstDead();

    bullet.reset(sprite.x - 8, sprite.y - 8);

    game.physics.arcade.moveToPointer(bullet, 300);
};

theGame.prototype.createBullet = function(){

};

theGame.prototype.sendState = function(){
	var statePacket = new PacketTypes.ClientToServerUpdatePacket(this.thePlayer.body.x,
																 this.thePlayer.body.y,
																 this.thePlayer.angle,
																 this.playerHasGunOut);
	PacketHandler.sendPacket(statePacket);
}

theGame.prototype.updatePlayerData = function(updatePacket){
	for(var i = 0; i < otherPlayerList.length; i++){
		if(updatePacket.playerID === otherPlayerList[i].data.playerID){
			otherPlayerList.data.playerID[i].data.model = updatePacket.model;
			otherPlayerList.data.playerID[i].data.model = updatePacket.model;

			//Updating model is computationally expensive, only do it when needed
			if(updatePacket.model != otherPlayerList.data.model){
				otherPlayerList[i].modelUpdated = true;
			}
			return;
		}
	}
}

theGame.prototype.handlePacket = function(packet){
	if(packet.id === PacketTypes.ENDGAMEPACKETID || PacketTypes.CHATMESSAGEPACKETID){
		console.log("theGame.prototype recieved a packet if should not have");
	}
	else if(packet.id === PacketTypes.PLAYERUPDATEPACKETID){
		updatePlayerData(packet);
	}
	else if(packet.id === PacketTypes.BULLETSPAWNPACKETID){
		//spawn some lead
	}
};

theGame.prototype.sendUpdatePacketToServer = function(){
	var updatePacket = new PacketTypes.ServerUpdatePacket(x, y, model, rotation, gunOut);

	PacketHandler.sendPacket(updatePacket)
}

theGame.prototype.getPlayerSkinResource = function(modelID, hasGun){
	if(hasGun){
		return "p" + modelID + "_gun";
	}
	else{
		return "p" + modelID + "_hold";
	}
}