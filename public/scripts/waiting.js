

var waiting = function(game){
	console.log("Waiting on server to start");
};

var waitingScreenText;

waiting.prototype.preload =  function(){
	console.log("Waiting Screen: Loaing Assets");
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
}

waiting.prototype.create = function(){
	waitingScreenText = game.add.text(game.world.centerX, game.world.centerY, 'Waiting on other players', { font: "64px Arial", fill: "#000000", align: "center" });

	//For debugging
	this.readyToStart();
}

waiting.prototype.readyToStart = function(spawnPacket){
	console.log("Preparing to start game");
	game.state.start("theGame", true, false, );
}

waiting.prototype.handlePacket = function(packet){
	if(packet.id == PacketTypes.SPAWNPACKETID){
		readyToStart(packet);
	} else {
		console.log("Look like the game already started.  Did something go wrong? ")
	}
};