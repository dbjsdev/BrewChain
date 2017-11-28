const Crypto = require('crypto');

const BrewChain = function() {
	let chain = [];
	let currentBlock = {};
	let genesisBlock = {};

	function init(){
		genesisBlock = { 
			index: 0
		  , timestamp: 1511818270000
		  , data: 'our genesis data'
		  , previousHash: "-1"
		  , nonce: 0
		};

		genesisBlock.hash = createHash(genesisBlock);
		chain.push(genesisBlock);
		currentBlock = genesisBlock; 
	}

	function createHash({ timestamp, data, index, previousHash, nonce }) {
		return Crypto.createHash('SHA256').update(timestamp+data+index+previousHash+nonce).digest('hex');
	}

	function addToChain(block){

		if(checkNewBlockIsValid(block, currentBlock)){
			chain.push(block);
			currentBlock = block; 
			return true;
		}
		
		return false;
	}

	function createBlock(data){
		let newBlock = {
		    timestamp: new Date().getTime()
		  , data: data
		  , index: currentBlock.index+1
		  , previousHash: currentBlock.hash
		  , nonce: 0
		};

		newBlock = proofOfWork(newBlock);

		return newBlock;
	}

	function proofOfWork(block){

		while(true){
			block.hash = createHash(block);
			if(block.hash.slice(-3) === "000"){	
				return block;
			}else{
				block.nonce++;
			}
		}
	}

	function getLatestBlock(){
		return currentBlock;
	}

	function getTotalBlocks(){
		return chain.length;
	}

	function getChain(){
		return chain;
	}

	function replaceChain(newChain){
		chain = newChain;
		currentBlock = chain[chain.length-1];
	}

	function checkNewBlockIsValid(block, previousBlock){
		if(previousBlock.index + 1 !== block.index){
			//Invalid index
			return false;
		}else if (previousBlock.hash !== block.previousHash){
			//The previous hash is incorrect
			return false;
		}else if(!hashIsValid(block)){
			//The hash isn't correct
			return false;
		}
		
		return true;
	}	

	function hashIsValid(block){
		return (createHash(block) == block.hash);
	}

	function checkNewChainIsValid(newChain){
		//Is the first block the genesis block?
		if(createHash(newChain[0]) !== genesisBlock.hash ){
			return false;
		}

		let previousBlock = newChain[0];
		let blockIndex = 1;

        while(blockIndex < newChain.length){
        	let block = newChain[blockIndex];

        	if(block.previousHash !== createHash(previousBlock)){
        		return false;
        	}

        	if(block.hash.slice(-3) !== "000"){	
        		return false;
        	}

        	previousBlock = block;
        	blockIndex++;
        }

        return true;
	}

	return {
		init,
		createBlock,
		addToChain,
		checkNewBlockIsValid,
		getLatestBlock,
		getTotalBlocks,
		getChain,
		checkNewChainIsValid,
		replaceChain
	};
};

module.exports = BrewChain;