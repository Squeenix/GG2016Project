

var waiting = function(game){
	console.log("Waiting on server to start");
};

var waitingScreenText;

waiting.prototype.preload =  function(){
	game.load.tilemap('map', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON);
	game.load.image('tiles', 'assets/spritesheet_tiles.png');
	
	//Not enough time to bother with manually mapping a spritesheet with variables sizes
	game.load.image('p1gun', 'assets/p1_gun.png');
	game.load.image('p2gun', 'assets/p2_gun.png');
	game.load.image('p3gun', 'assets/p3_gun.png');
	game.load.image('p4gun', 'assets/p4_gun.png');
	game.load.image('p5gun', 'assets/p5_gun.png');
	game.load.image('p6gun', 'assets/p6_gun.png');

	game.load.image('p1hold', 'assets/p1_hold.png');
	game.load.image('p2hold', 'assets/p2_hold.png');
	game.load.image('p3hold', 'assets/p3_hold.png');
	game.load.image('p4hold', 'assets/p4_hold.png');
	game.load.image('p5hold', 'assets/p5_hold.png');
	game.load.image('p6hold', 'assets/p6_hold.png');

	game.load.image('bullet', 'assets/bullet.png');

	console.log("Waiting Screen: Assets successfully loaded");
}

waiting.prototype.create = function(){
	//Javascript closure magic　ツ
	//Closure magic
	var context = this;
	changeEventRecipient(function(packet){ context.handlePacket(packet); });
	waitingScreenText = game.add.text(game.world.centerX, game.world.centerY, 'Waiting on other players', { font: "64px Arial", fill: "#000000", align: "center" });

	var wantToPlay = new PacketTypes.WantToPlayPacket();
	sendPacket(wantToPlay);
	console.log("Sent Request to Play");
	//For debugging
}

waiting.prototype.readyToStart = function(spawnPacket){
	console.log("Preparing to start game.");
	game.state.start("theGame", true, false, spawnPacket);
}

waiting.prototype.handlePacket = function(packet){
	if(packet.id === PacketTypes.SPAWNPACKETID){
		this.readyToStart(packet);
	} else {
		packetQueue.push(packet);
	}
};