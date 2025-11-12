

import {Protocol} from "sack.vfs/client-protocol"
//import {UserDbRemote} from "@d3x0r/user-database-remote";

import LoginClient from "@d3x0r/user-database-remote/node" 

const login = new LoginClient();

if(0)
login.on( "connect", ()=>{
		// and then we can resume and junk...
		console.log( "got connect on login" );
		return login.request( "d3x0r.org", "Entity Space" ).then( ()=>{
		} );
} );


// socket will have methods available for communicating with login service.
class EntityProtocol extends Protocol {
	constructor() {
		super( "http://localhost:5542", ".org.d3x0r.dekware.entity-space" );
		this.on( "open", this.open.bind(this));
	}

	open( ) {
		// okay now what?
		this.send( {op:"message1" } );
	}

	login( a,b ) {
		return login.login( a, b );
	}
	create( a,b ) {
		return login.create( a, a, b, b );
	}
	resume( ) {
		return login.resume();
	}
	requestService( a,b ) {
		return login.request("d3x0r.org", "Entity Space" ).then( (result)=>{
/*
				console.log( "Service result:", result );
Service result: {
  svc: { addr: { addr: [], port: 5542 }, key: [ 'q3Bp$Git8_MJj0Rp' ] },
  name: 'd3x\\/\\/4r3:service'
}
*/
				this.send( { op:"join", key:msg.svc.key[0] } );

			} );
	}
}

export const entityProtocol = new EntityProtocol();