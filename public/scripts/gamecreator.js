var game = new Phaser.Game(640, 480, Phaser.AUTO, "Game");

// In pixels per second
var moveVelocity = 150;
var bulletVelocity = 600;

// In millseconds/bullet
var fireRate = 100;


game.state.add("waiting", waiting);
game.state.add("theGame", theGame);
game.state.start("waiting");

console.log("Attempting to intialize socket to server");

/** Shit for sending packets **/
var PacketHandler = {
	gameSocket: io(),
	packetReciever: io.on('gameSocket', function(){
		game.
	});
	sendPacket: function(packet){
		io.
	}
};