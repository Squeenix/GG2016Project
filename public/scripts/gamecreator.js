//This is basically the random crap class

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

/* SEnd packets */

//really crappy version of events

var packetQueue = [];

var eventRecipient;

function changeEventRecipient(callback){
	eventRecipient = callback;
	while(packetQueue.length > 0){
		eventRecipient(packetQueue.shift());
	}
}

function defaultEventRecipient(packet){
	packetQueue.push(packet);
}

function dismountEventRecipient(){
	eventRecipient = defaultEventRecipient;
}

var gameSocket = io();

//Initial state
eventRecipient = defaultEventRecipient;

var packetReciever = gameSocket.on('gameSocket', function(packet){
	// Pipe to the client
	if(packet.id === PacketTypes.CHATMESSAGEPACKETID){
		handleChatPacket(packet);
	}
	else{
		//Pipe to the game
		eventRecipient(packet);
	}
});

var sendPacket = function(packet){
	gameSocket.emit('gameSocket', packet);
};

var handleChatPacket = function (packet){
	var from = packet.sender;
	var msg = packet.message;
	$('#messageList').append("<br><b>" + from + "</b>: " + msg);
	$("#messageList").animate({ scrollTop: $('#messageList').prop("scrollHeight")}, 1000);
}

