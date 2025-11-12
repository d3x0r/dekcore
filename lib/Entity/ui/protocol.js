

import {Protocol} from "/node_modules/sack.vfs/apps/http-ws/client-protocol.js"

class EntityProtocol extends Protocol {
	constructor() {
		super( ".org.d3x0r.dekware.entity-space" );
		this.on( "open", this.open.bind(this));
	}

	open( ) {
		// okay now what?
		this.send( {op:"message1" } );
	}

}

new EntityProtocol();