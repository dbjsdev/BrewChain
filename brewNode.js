const BrewChain = require('./brewChain');
const WebSocket = require('ws');

const BrewNode = function(port){
    let brewSockets = [];
    let brewServer;
    let _port = port
    let chain = new BrewChain();

    const REQUEST_CHAIN = "REQUEST_CHAIN";
    const REQUEST_BLOCK = "REQUEST_BLOCK";
    const BLOCK = "BLOCK";
	const CHAIN = "CHAIN";

    function init(){

        chain.init();
		
        brewServer = new WebSocket.Server({ port: _port });
		
        brewServer.on('connection', (connection) => {
            console.log('connection in');
            initConnection(connection);
        });		
    }

    const messageHandler = (connection) =>{
        connection.on('message', (data) => {
            const msg = JSON.parse(data);
            switch(msg.event){
            	case REQUEST_CHAIN:
                    connection.send(JSON.stringify({ event: CHAIN, message: chain.getChain()}))    
                    break;                  
            	case REQUEST_BLOCK:
                    requestLatestBlock(connection);
                    break;      
                case BLOCK:
                    processedRecievedBlock(msg.message);
                    break;  
                case CHAIN:
                    processedRecievedChain(msg.message);
                    break;  

                default:  
                    console.log('Unknown message ');
            }
        });
    }


    const processedRecievedChain = (blocks) => {
        let newChain = blocks.sort((block1, block2) => (block1.index - block2.index))

        if(newChain.length > chain.getTotalBlocks() && chain.checkNewChainIsValid(newChain)){
        	chain.replaceChain(newChain);
        	console.log('chain replaced');
        }
    }

    const processedRecievedBlock = (block) => {

        let currentTopBlock = chain.getLatestBlock();

        // Is the same or older?
        if(block.index <= currentTopBlock.index){
        	console.log('No update needed');
        	return;
        }

        //Is claiming to be the next in the chain
        if(block.previousHash == currentTopBlock.hash){
        	//Attempt the top block to our chain
        	chain.addToChain(block);

        	console.log('New block added');
        	console.log(chain.getLatestBlock());
        }else{
        	// It is ahead.. we are therefore a few behind, request the whole chain
        	console.log('requesting chain');
        	broadcastMessage(REQUEST_CHAIN,"");
        }
    }

    const requestLatestBlock = (connection) => {
        connection.send(JSON.stringify({ event: BLOCK, message: chain.getLatestBlock()}))   
    }

    const broadcastMessage = (event, message) => {
        brewSockets.forEach(node => node.send(JSON.stringify({ event, message})))
    }

    const closeConnection = (connection) => {
        console.log('closing connection');
        brewSockets.splice(brewSockets.indexOf(connection),1);
    }

    const initConnection = (connection) => {
        console.log('init connection');

        messageHandler(connection);
        
        requestLatestBlock(connection);

        brewSockets.push(connection);

        connection.on('error', () => closeConnection(connection));
        connection.on('close', () => closeConnection(connection));
    }

    const createBlock = (teammember) => {
        let newBlock = chain.createBlock(teammember)
        chain.addToChain(newBlock);

		broadcastMessage(BLOCK, newBlock);

    }

    const getStats = () => {
        return {
            blocks: chain.getTotalBlocks()
        }
    }

    const addPeer = (host, port) => {
        let connection = new WebSocket(`ws://${host}:${port}`);

        connection.on('error', (error) =>{
            console.log(error);
        });

        connection.on('open', (msg) =>{
            initConnection(connection);
        });
    }

    return {
        init,
        broadcastMessage,
        addPeer,
        createBlock,
        getStats
    }

}

module.exports = BrewNode;