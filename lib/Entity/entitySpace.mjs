import {sack} from "sack.vfs";
const JSOX=sack.JSOX;
import {Protocol} from "sack.vfs/protocol"
import {entityInterface} from "./entity.mjs"
import fc from "../file-storage/file_cluster.mjs";

//import {ObjectStorage} from "sack.vfs/object-storage";


import {getUser, enableLogin} from "@d3x0r/user-database-remote/enableLogin";

const connections = new Map();
const sockets = new WeakMap();

// socket will have methods available for communicating with login service.


//import {sack} from "sack.vfs";
const DB = sack.DB( "dekware.db" );


import {config as sysConfig} from "../config/config.mjs"
sysConfig.resume();
const config = await fc.inited.then( ()=>fc.reload( "config.jsox").then( (data)=>data || (fc.store( "config.jsox", {} ), {})))


console.log( "Config:", config );
if( config === undefined ) process.exit(1);

if( !config["The Void"] ) {
	entityInterface.create( null, "The Void", "Swirling transparent black clouds glisten around you.", async (o)=>{
		console.log( "Got back the void:", o );
		config["The Void"] = await o.save();
		console.log( "Got ID right?", config["The Void"] );
		fc.store( "config.jsox", config);
	} );
} else {
	console.log( "The void should already exist, and we just have to reload it!" );
}

class EntityProtocol extends Protocol {
	constructor() {
		super( {port:Number( process.env.PORT )||config.port || 5542, resourcePath:"ui", npmPath:"../../" }, ".org.d3x0r.dekware.entity-space" );
		const this_ = this;
		enableLogin( this.server, this.server.app, (user)=>{
			// expect.
			const uid = sack.Id();
			connections.set(uid,user);
			console.log( "Sending an ID back through login services for User to connect" );
			return uid;
		} ); 
		this.on( "connect", (ws, myWS)=>{
			// okay and then what?			
		} );


		this.on( "message1", (ws,msg)=>{
			//console.log( "this works like this?", ws,msg ) 
			const s = sockets.get( ws );
			if( s ) {
				ws.send( {op:"message1", message1:true} );
			} else {
				ws.send( {op:"message1", message1:false} );
			}
		} );
		this.on( "join", (ws,msg)=>{
			//console.log( "this works like this?", ws,msg ) 
			const user = connections.get( msg.key );
			console.log( "Got user from client expect key?", user );
			ws.send( {op:"join", join:false} );
		} );
	}
}
new EntityProtocol();