// This source is loaded, and appended with sandboxPrerun.js
Error.stackTraceLimit = Infinity;

import util from "node:util";
import {sack} from "sack.vfs";
const console = { log( ...a) { sack.log( util.format( ...a ) ) } };

console.log( "Worker Module:", import.meta );

sack.log( util.format( "worker init global:", globalThis ) ); 

import wt from 'node:worker_threads'
const Λ = wt.workerData.Λ;

//const sack = require( 'sack.vfs' );
sack.log( util.format( "RUNNING?", process.version ) );

sack.Volume.Thread.accept( Λ, (ident,hostedVolume)=>{ 
	console.log( "caught nativedisk" );
	sandbox.nativeDisk = hostedVolume 
});




const idGen = sack.SaltyRNG.id;
sack.system.disallowSpawn();

const pendingInit = [];
var initDispatched = false;
sack.ObjectStorage.Thread.accept( Λ, (ident,hostedVolume)=>{

	sandbox.storage = hostedVolume;

	hostedVolume.getRoot()
		.then( (dir)=>{
			sandbox.disk = dir;
			console.log( "Resume waiter on init...");

			dir.open( "config.jsox" )
			.then( file=>file.read( )
				.then( (d)=>{ 
				    sandbox.config = d; 
				    initDispatched = true;
				    for( var cb of pendingInit ) cb();
				    pendingInit.length=0;
				})
				.catch( (err)=>{
				    console.log( "Error in write:", err)
				    file.write( JSOX.stringify( config)).then( ()=>{
					    console.log( "config has been stored...")
					    initDispatched = true;
					    for( var cb of pendingInit ) cb();
					    pendingInit.length=0;
					})
					.catch(err)( (err)=>{
					    console.log( "Error putting config? (FATALITY)", err );
					})
				}) )
			.catch( (err)=>{console.log( "Directory open failed? Why?", err )})

	} )
	.catch( (err)=>{
	    console.log( "Get root failed?", err );
	})
} );

function Function() {
    throw new Error( "Please use other code import methods.");
}
function eval_() {
    throw new Error( "Please use other code import methods.");
}

globalThis.Λ =Λ;
globalThis.onInit = (cb) =>{
	    if( initDispatched)cb();
	    else pendingInit.push(cb);
	}
const sandbox = globalThis.sandbox = globalThis;


		/* Seal Sandbox */
		["sandbox"].forEach(key => {
	   	 if( key in globalThis )
			    Object.defineProperty(globalThis, key, { enumerable: false, writable: true, configurable: false });
		});



process.on('unhandledRejection', err=>{
	sack.log( util.format( "sandboxInit2.no-vm.mjs:Unhandled Rejection", err, '\n'+new Error() ) );
} );
process.on('unhandledException', err=>{
	sack.log( util.format( "sandboxInit2.no-vm.mjs:Unhandled Exception", err, '\n'+new Error() ) );
} );

                         console.log( "did this run though?" );
import( "./sandboxPrerun2.mjs" ).then( (module)=>{
	console.log( "module worked?", module );
	module.prerun( Λ, { send(msg) {
	console.log( "Worker thread send?", msg );	
 } } );
	return module;
} ).catch( (err)=>{
	console.log( "module failed:", err )
} );;