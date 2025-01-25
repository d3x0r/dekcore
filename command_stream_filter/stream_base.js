
import Events from "sack.vfs/Events2" 
import JSOX from "jsox"


// work in progress... this should be implemented...
class Duplex extends Events {
	
	_read(size) {
	}
	_write(chunk,decoding,callback) {
		callback();
	}
	push( data ) {
				
	}
	close() {
		this.on( "close", true );
	}
}

class Stream {

		
}
