var Factions = {
	TERRORIST: {id: 100001, name: "Terrorist"},
	POLICEMAN: {id: 100002, name: "Policeman"},
	CIVILIAN: {id: 100003, name: "Civilian"},
	JUDGE: {id: 100004, name: "Judge"},
	MAFIA: {id: 100005, name: "Mafia"},
};

var theGame = function(game){
	console.log("Waiting on server to start");
}

/** Handles the custom parameter (spawn packet) which starts the game from the waiting screen */
theGame.prototype.init = function(spawnpacket){
	this.yourID = spawnpacket.yourID;
	this.initPlayerList = spawnpacket.users;
}

theGame.prototype.preload = function(){
	
	this.nextFire = 0;
	this.fireRate = 10000;

	this.wasd = {
		up: game.input.keyboard.addKey(Phaser.Keyboard.W),
		down: game.input.keyboard.addKey(Phaser.Keyboard.S),
		right: game.input.keyboard.addKey(Phaser.Keyboard.A),
		left: game.input.keyboard.addKey(Phaser.Keyboard.D)
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

	this.otherPlayerGroup = game.add.physicsGroup();

	for(var i = 0; i < this.initPlayerList.length; i++){
		if(this.initPlayerList[i].playerID === this.yourID){
			var mainCharacterData = this.initPlayerList[i];
			//Sprite Setup
			this.thePlayer = game.add.sprite(mainCharacterData.x,
							 				 mainCharacterData.y,
							 				 this.getPlayerSkinResource(mainCharacterData.model, false));
			this.model = mainCharacterData.model;
			this.faction = mainCharacterData.faction;
			this.isDead = false;
			this.thePlayer.anchor.setTo(0.5);
		}
		else{
			var playerData = this.initPlayerList[i];
			var playerSprite = this.otherPlayerGroup.create(playerData.x, playerData.y, this.getPlayerSkinResource(playerData.model, false));
			playerSprite.bodyWidth = 20;
			playerSprite.bodyHeight = 30;
			playerSprite.anchor.setTo(0.5);
			playerSprite.body.immovable = true;
			this.otherPlayerList.push({data:playerData, sprite:playerSprite, modelUpdated:false});
		}
	}
	this.hasGun = false;
	//BULLETS

	//Enemy Bullets
	this.enemyBullets = game.add.group();
    this.enemyBullets.enableBody = true;
    this.enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyBullets.createMultiple(100, 'bullet');
    
    this.enemyBullets.setAll('anchor.x', 0.5);
    this.enemyBullets.setAll('anchor.y', 0.5);
    this.enemyBullets.setAll('outOfBoundsKill', true);
    this.enemyBullets.setAll('checkWorldBounds', true);

    //Enemy Bullets
	this.dummyBullets = game.add.group();
    this.dummyBullets.enableBody = true;
    this.dummyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.dummyBullets.createMultiple(100, 'bullet');
    
    this.dummyBullets.setAll('anchor.x', 0.5);
    this.dummyBullets.setAll('anchor.y', 0.5);
    this.dummyBullets.setAll('outOfBoundsKill', true);
    this.dummyBullets.setAll('checkWorldBounds', true);

    this.bullets = game.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(20, 'bullet', 0, false);
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 0.5);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);


	this.collidableLayer = this.map.createLayer('Collidables');
	this.collidableLayer.resizeWorld();

	this.otherPlayerGroup.enableBody = true;
    this.otherPlayerGroup.physicsBodyType = Phaser.Physics.ARCADE;

	//Collision Groups (replace with p2 physics sometime)

	//this.collideBoxes = this.map.createLayer('CollideBoxes');
	//this.collideBoxes.resizeWorld();


	//Keyhandling
	game.input.keyboard.addKey(Phaser.Keyboard.X).onDown.add(theGame.prototype.takeOutGun, this);


	this.thePlayer.collideWorldBounds = true;
	game.physics.arcade.enable(this.thePlayer);
	game.camera.follow(this.thePlayer);

	//Don't be lazy and go map this shit out so it doesn't look like shit
	//replace with collideboxes when you replace arcade with p2 physics
	this.map.setCollisionBetween(1, 539, true, this.collidableLayer, true);

	//Closure magic
	var context = this;
	changeEventRecipient(function(packet){ context.handlePacket(packet); });
};

theGame.prototype.update = function() {

	//Do collision between player and enemy bullets
	game.physics.arcade.overlap(this.enemyBullets, this.thePlayer, this.playerHitByBullet, null, this);
	//game.physics.arcade.overlap(this.bullets, this.otherPlayerGroup, this.playerHitByDummyBullet, null, this);

	game.physics.arcade.overlap(this.thePlayer, this.otherPlayerGroup);
	if (game.input.activePointer.isDown)
    {
        this.shootBullet();
    }

	if(this.thePlayer.isDead){

	}
	if (game.input.activePointer.withinGame)
    {
        game.input.enabled = true;
        game.stage.backgroundColor = '#736357';
    }
    else
    {
        game.input.enabled = false;
        game.stage.backgroundColor = '#731111';
    }

	game.physics.arcade.collide(this.thePlayer, this.collidableLayer);
	game.physics.arcade.collide(this.thePlayer, this.otherPlayerGroup);


	var mouseX = game.input.mousePointer.x;
	var mouseY = game.input.mousePointer.y;
	var centerX = game.width / 2;
	var centerY = game.height / 2;

	/* Move towards the mouse pointer.  Also the characer is centered at the player 
	which is why we can use global window coordinates */

	if(!this.isDead){
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
	}

    this.sendUpdatePacketToServer();
};

theGame.prototype.takeOutGun = function(){
	var classAllowsGun = this.faction === Factions.TERRORIST.id || this.faction === Factions.JUDGE.id ;
	if(!classAllowsGun){
		return;
	}
	if(this.hasGun){
		this.thePlayer.loadTexture(this.getPlayerSkinResource(this.model, false));
		this.hasGun = false;
	}
	else{
		this.thePlayer.loadTexture(this.getPlayerSkinResource(this.model, true));
		this.hasGun = true;
	}

};

/* Creates a bullet.  Also sends a spawning packet to the server */
theGame.prototype.shootBullet = function(){
	if(!this.hasGun) return;
	if (game.time.now > this.nextFire && this.bullets.countDead() > 0){
        this.nextFire = game.time.now + this.fireRate;

        var bullet = this.bullets.getFirstExists(false);

        bullet.reset(this.thePlayer.x, this.thePlayer.y);

        var speed = 700;
        
		var mouseX = game.input.mousePointer.x;
		var mouseY = game.input.mousePointer.y;
		var centerX = game.width / 2;
		var centerY = game.height / 2;

		var vectorX = mouseX - centerX;
		var vectorY = mouseY - centerY;
		var magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY);

		bullet.body.velocity.x = vectorX / magnitude * speed; 
		bullet.body.velocity.y = vectorY / magnitude * speed;

		var bulletPacket = new PacketTypes.BulletSpawnPacket(this.thePlayer.x, this.thePlayer.y, bullet.body.velocity.x, bullet.body.velocity.y);
		sendPacket(bulletPacket);
    }
};


theGame.prototype.updatePlayerData = function(updatePacket){
	for(var i = 0; i < this.otherPlayerList.length; i++){
		if(updatePacket.playerID === this.otherPlayerList[i].data.playerID){
			//this is bad code but oh well
			this.otherPlayerList[i].data = updatePacket;
			
			var dead = updatePacket.isDead;
			
			//Updating model is computationally expensive, only do it when 
			//because it would be sad to see a top down shooter lag in 2016
			this.otherPlayerList[i].sprite.loadTexture(this.getPlayerSkinResource(updatePacket.model, updatePacket.hasGun));


			//Now update the sprite
			var bodyData = this.otherPlayerList[i].data;
			var sprite = this.otherPlayerList[i].sprite;
			sprite.x = bodyData.x;
			sprite.y = bodyData.y;
			sprite.rotation = bodyData.rotation;

			if(dead){
				sprite.opacity = 0.3;
			}

			this.otherPlayerList[i].data = updatePacket;
			
			return;
		}
	}
};


theGame.prototype.handlePacket = function(packet){
	if(packet.id === PacketTypes.ENDGAMEPACKETID || packet.id === PacketTypes.CHATMESSAGEPACKETID){
		console.log("theGame.prototype recieved a packet if should not have recieved.");
	}
	else if(packet.id === PacketTypes.PLAYERUPDATEPACKETID){
		this.updatePlayerData(packet);
	}
	else if(packet.id === PacketTypes.BULLETSPAWNPACKETID){
		this.spawnEnemyBullet(packet);
	}
};


theGame.prototype.sendUpdatePacketToServer = function(){
	var updatePacket = new PacketTypes.ServerUpdatePacket(this.thePlayer.x,
														  this.thePlayer.y, 
														  this.model,
														  this.thePlayer.rotation, 
														  this.hasGun,
														  this.isDead);
	sendPacket(updatePacket);
};

theGame.prototype.spawnEnemyBullet = function(packet){
	var bullet = this.enemyBullets.getFirstExists(false);

        bullet.reset(packet.x, packet.y);
        bullet.body.velocity.x = packet.xVel;
        bullet.body.velocity.y= packet.yVel;
}

theGame.prototype.spawnEnemyDummyBullet = function(packet){
	var bullet = this.dummyBullets.getFirstExists(false);

        bullet.reset(packet.x, packet.y);
        bullet.body.velocity.x = packet.xVel;
        bullet.body.velocity.y= packet.yVel;
}


theGame.prototype.playerHitByBullet = function(player, bullet){
	console.log("Got hit");
	this.isDead = true;
	bullet.kill();
}

theGame.prototype.playerHitByDummyBullet = function(player, bullet){
	bullet.kill();
	//Nothing happens except the bullet is destroyed
}

/* Returns the string for fetching the skin based off of the Model ID*/
theGame.prototype.getPlayerSkinResource = function(modelID, hasGun){
	if(hasGun){
		return "p" + modelID + "gun";
	}
	else{
		return "p" + modelID + "hold";
	}
};