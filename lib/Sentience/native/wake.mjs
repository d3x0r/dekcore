
// Wake is the interface from the main threaded side
// It creates a remote thread, setup using sandboxInit.js and sandboxPrerun.js
// 
//

const _debug_thread_create = false;
const _debug_commands = false;
const _debug_commands_input = _debug_commands || false;
const _debug_commands_send = _debug_commands || false;
const _debug_entity_command_handling = _debug_commands || false;
const _debug_getters = _debug_commands || false;
const _debug_run = false;

import {sack} from "sack.vfs";
import util from "util";

import fc from "../file-storage/file_cluster.mjs";
import wt_ from "worker_threads";

//const idMan = require( '../id_manager.js');
const wt = ( wt_.isMainThread && wt_ );

const disk = sack.Volume();

import Entity from "../Entity/entity.mjs"

const myPath = import.meta.url.split(/\/|\\/g);
const tmpPath = myPath.slice();
tmpPath.splice( 0, 3 );
tmpPath.splice( tmpPath.length-1, 1 );
const appRoot = (process.platform==="win32"?"":'/')+tmpPath.slice(0).join( '/' );
const parentRoot = (process.platform==="win32"?"":'/')+tmpPath.slice(0,-2).join( '/' );
             console.log( "AppRoot is sentience right?", appRoot );


//☺☻
const startupInitCode = disk.read( appRoot + "/sandboxInit.js" ).toString();
const startupPrerunCode = disk.read( appRoot + "/sandboxPrerun.js" ).toString()
		.replace( /import\s*{([^}]*)}\s*from\s*["']([^"']*)["']/g, "const {$1}=(await import(\"$2\"))" )
		.replace( /import\s*\*\s*as\s*([^ ]*)\s*from\s*["']([^"']*)["']/g, "const $1=(await import(\"$2\"))" )
		.replace( /import(.*(?!from))\s*from\s*["']([^"']*)["']/g, "const $1=(await import(\"$2\")).default" )
	
;

class identifier extends String {
	maker = null;
	constructor(a) { super(a) };
}


// 
// this is sort of an abstraction to communicate with a remote...
// it can be a socket(.send,.onmessage) or worker (postMessage,on("message") or...
// 
class Thread {
		worker = null;
		socket = null;
		constructor( socket ) {
			this.socket = socket;
		}
		 post(msg) {
			//this.worker.stdin.write( JSOX.stringify(msg) );
			if( socket ) {
				_debug_commands_send && console.trace( "Post run:", msg );
				this.socket.send( msg );
			}else {
				_debug_commands_send && console.trace( "Post run:", msg );
				this.worker.postMessage( msg );
			}
		}
		runFile(code) {
			let code_;
			if( disk.exists( code ) ){
				code_ = disk.read( code );
				if( code_ ) code_ = code_.toString();
			}else
				code_ = code;
			if( code_ ) {
				console.log( "RunFile:", code );
				var msg = {op:'run', file:code, code:(code_), id:runId};
				this.post(msg);
				return new Promise( (res,rej)=>{
					pendingRuns.push( { runResult : res, runReject: rej, id : runId++ } );
				})
			}
		}
		get pendingRuns() { return pendingRuns}
		run(file,code) {
			if( this.worker ) {
				return new Promise( (res,rej)=>{
					_debug_run && sack.log( util.format("Posting run:", file, code, "to", e.name, new Error("").stack ));
					var msg = {op:'run', file:file, code:(code), id:runId };
					this.post(msg); 
					//console.log( "Pending run has pushed this one... and we return a promise.");
					pendingRuns.push( { module:e._module
						, runResult : res
						, runReject: rej
						, id : runId++ } );
				})
			}else {
				console.trace( "thread does not have a worker, Run fail. This shouldn't be running any VM code Yet.");
			}
		}
		
		 
		// ing() is an event but allows a cancel event from any participant. 
		// return value is 'may' or 'may not'  
		//        May = if forced accept or any may accept, this will get called for 'on'.  
		//        may not = if forced accept do not notify this.
		// return value is 'must' or 'must not'  
		//       force accept, force cancel all
		//       all handler must still be called to get their may/may not.
		//       a force cancel will override a force accept.
		ing( event, data ) {
			return this.post( { op:"ing", ing:makeIng(event), args:data });
		}
		emit( event, data ) {
				console.trace( "emitting an event:", e.name, event)

			//if( data instanceof idMan.keyRef )
			//	data = data.toString();
			// drop the promise result, there is no then or catch.
			if( this.worker ) 
				this.post( { op:"on", on:event, args:data });
				
			if(0)
			e.watchers.forEach( watcher=>{
				console.log( 'Sending event about', e.name, "to", watcher.name, "id:", e.Λ )
				watcher.thread.post( {op:"on",Λ:e.Λ.toString(),on:event,args:data} )
			})
		}
	}



function WakeEntity( e, noWorker, socket ) {
	var runId = 0;
	const pendingRuns = [];

	function processMessage( msg, string ) {
		//		_debug_commands_input && 
		console.trace( "core thread input: ",msg, string );
		try {
			if( msg.op )
				if( msg.op == 'error' ) {
					console.log( "Error is a result to 'run'", msg );
					var id = pendingRuns.findIndex( pend=>pend.id===msg.id);
					if( id >= 0 ){
						pendingRuns[id].runReject( msg.error );
						pendingRuns.splice(id,1);
					}
					else {
						console.log( "Error wasn't about a pending run...");
					}
				} else if( msg.op == 'out' ) {
					console.log( e.name, ":##:", msg.out );
				} else if( msg.op == 'echo' ) {
					msg.op = msg.echo;
					e.thread.post( msg );
				} else if( msg.op == 'f' ) {
					_debug_entity_command_handling && console.log( "Received general 'f'... ", msg );
					if( msg.f === "create" ){
						// this one has a callback to get the result
						// the others are all synchrounous normally
						//console.log( "create message:", msg )
						return e.create( msg.args[0], msg.args[1], (o)=>{
							try {
								//console.log( "And reply with created object" );
								let msgout = {op:msg.op,id:msg.id,ret:o.Λ.toString()};
								e.thread.post(msgout);
							} catch(err) {console.log(err);}    
						} )
					} else {
						if( !e[msg.f] ) {
								e.thread.post( { op:'error',id:msg.id,error:"Unknown Thing:"+msg.f,stack:"Stack.." } );
								return;
						}
						//console.log( "Doing:", msg.f );
						var r = e[msg.f].apply(e,msg.args)
						//console.log( "Result of call is:", r );
						if( r instanceof Promise )
							r.then((r)=> {
								// r is a Number that is the code stack length...
								// the result of the post run was stored with this ID
								// so internally the scirpt has already run by this point
								//console.log( "R is :", r );
								e.thread.post( {op:msg.op,id:msg.id,ret:r} ) 
							})
								.catch((err)=>e.thread.post( { op:'error',id:msg.id,error:err,stack:err.stack } ) );
						else {
							sack.log( util.format( "it's a promise but not?", r, msg.f ));
							e.thread.post( {op:msg.op,id:msg.id,ret:r} );
						}
					}
				} else if( msg.op == 'e' ) {
					var o = Entity.makeEntity( msg.o );
					if( o ) {
						var eParts = msg.e.split('.');
						var f = o;
						for( let i = 0; i < eParts.length; i++ ) f = f[eParts[i]];
						if( !f )
							console.log( "Failed to find function for 'e':", o, msg.e  )
						_debug_entity_command_handling && console.log( "Calling method:", msg.e, msg.id, msg );
						var r = f.apply(o, msg.args);
						_debug_entity_command_handling && console.log( "Done with that method...", msg.e, msg.id );
						if( r instanceof Promise ) {
							r.then( (r)=>{
									//sack.log( util.format( "Promise result should be an integer here:", new Error().stack,msg, r ));
									
									if( msg.e === "wake" )// native wake now results with the thread instead of true/undefined
										e.thread.post({op:msg.op,id:msg.id,ret:!!r}) 
									else
										e.thread.post({op:msg.op,id:msg.id,ret:r}) 
								})
								.catch((err)=>e.thread.post( {op:'error',id:msg.id,error:err,stack:err.stack}));
						} else {
							//console.log( "And then r = ",r);
							let msgout = {op:msg.op,id:msg.id,ret:r};
							e.thread.post(msgout);
						}
					}
				} else if( msg.op == 'g' ) {
					var r = e[msg.g];
					if( r instanceof Promise ) {
						r.then((r)=>{
							_debug_getters && console.log( "my Getter called:", msg.g, "=", r );
							let msgout = {op:msg.op,id:msg.id,ret:r};
							e.thread.post(msgout);
						}).catch((err)=>{
							return e.thread.post( {op:'error',id:msg.id,error:err,stack:err.stack});
						});
					} else {
						_debug_getters && console.log( "my Getter called:", msg.g, "=", r );
						let msgout = {op:msg.op,id:msg.id,ret:r};
						e.thread.post(msgout);
					}
				} else if( msg.op == 'h' ) {
					var o = Entity.makeEntity(msg.o);
					if( !o ) { 
						console.warn ( "failed to find entity", msg );
						return e.thread.post( {op:'error',id:msg.id,error:"Failed to find entity",stack:"no stack"});
					}
					_debug_getters && console.log( "Getter called:", msg.h );
					var r = o[msg.h];
					if( r instanceof Promise ) {
						r.then((r)=>{
							_debug_getters && console.log( "Getter result:", r );
							return e.thread.post({op:msg.op,id:msg.id,ret:r});
						}).catch((err)=>e.thread.post( {op:'error',id:msg.id,error:err,stack:err.stack}) );
					} else {
						_debug_getters && console.log( "Getter result:", r );
						return e.thread.post({op:msg.op,id:msg.id,ret:r});
					}
				} else if( msg.op == 'run' ) {
					_debug_run && console.log( "response to 'run'", msg );
					var id = pendingRuns.findIndex( pend=>pend.id===msg.id);
					_debug_run && sack.log( util.format("got Reply for run result:", id, msg ));
					if( id >= 0 ){
						pendingRuns[id].runResult( msg.ret );
						pendingRuns.splice(id,1);
					}
				} else if( msg.op === "initDone"){
					resolveThread( thread );
					fc.Store( e.Λ ).then( (result)=>{

						var threadVolume = result.objectStorage;
						//console.log( "probably need to send the root file object reference too...", result.objectStorage, Object.getPrototypeOf( result.objectStorage ), result.root );
						sack.ObjectStorage.Thread.post(e.Λ.toString(), threadVolume );
					} );
					//console.trace( "posting another storage for native", e.Λ.toString()+"?", e.name, msg);
					//sack.Volume.Thread.post(e.Λ.toString(), sack.Volume() );                    
				} else if( msg.op[0] == '~' ) {
					console.log( "not an RPC...");
				}else {
					//e.creator.push();
				}
			else {
				console.log( ":!!:", msg );
			}
		} catch(err) {
			if( msg ) {
				let msgout = {op:'error',id:msg.id,cmd:msg.op,error:err.message, stack:err.stack};
				//console.log( "Throw error result (back)to thread:", msgout, msg, err );
				e.thread.post(msgout);
			} else {
				e.thread.post(util.format( "WHAT?", err ));

			}
		}

	}

	function makeIng( verb ) {
		if( verb.endsWith( "y" ) 
			|| verb.endsWith( "o" ) 
			|| verb.endsWith( "a" )
			|| verb.endsWith( "u" )
			|| verb.endsWith( "w" ) ) {
			// try -> trying
			// scuba -> scubaing
			// moto -> motoing
			return verb + "ing";
		} else if( verb.endsWith( "e" ) ) {
			if( verb[verb.length-2] === 'i') {
				// untie untying
				return verb.substr(0,verb.length-2) + "ying";
			}
			// make -> making
			// congrue ->congruing
			return verb.substr(0,verb.length-1) + "ing";
		} else {
			// ram -> ramming
			return verb + verb.substr(verb.length-1,1) + "ing";
		}
	}

	// this is an interface to the communications port...
	const thread = e.thread = new Thread( socket );//thread;

	if( socket ) {
		_debug_thread_create && console.trace( "Waking up entity:", e.name, e.Λ, e.thread )
		// this is the thread that should be this...
		// so don't create a worker thread again. (tahnkfully worker_thread fails import of second worker_threads.)
		//socket.accept()

		socket.on("message",processMessage);

		const invokePrerun = `{op:start,Λ:'${e.Λ.toString()}'}`
		socket.send( invokePrerun );

	}
	var resolveThread;

	if( socket ) {
		const send_ = thread.socket.send.bind(thread.socket);
		function mySend(msg) {
			if( "object" === typeof msg ) {
				msg = JSOX.stringify( msg );
			}
			send_( msg );
		}
		thread.socket.send = mySend;
		thread.socket.on("message",processMessage);
		return new Promise( (res,rej)=>{
			resolveThread = res;
		})

	}
	if( wt && !noWorker && !socket ) {

		_debug_thread_create && console.trace( "Waking up entity:", e.name, e.Λ, e.thread )
		// this is the thread that should be this...
		// so don't create a worker thread again. (tahnkfully worker_thread fails import of second worker_threads.)
		console.log( "Invoke waking an object with a startup code..." );

		const invokePrerun = `{vm.runInContext( ${JSON.stringify(startupPrerunCode)}, sandbox, {importModuleDynamically : vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER, filename:"sandboxPrerun.js"});}`

		// used to mount the file system, and sack could get it directly within the sandbox...
		//fc.cvol.mount(e.Λ.toString()); 
		const id = { Λ: new identifier(JSON.stringify(e.Λ.toString())) };
		id.Λ.maker = e.created_by.Λ.toString();

		thread.worker = new wt.Worker( 
				"../lib/Sentience/sandboxInit.mjs"
/*
			  'const Λ=' + JSON.stringify(e.Λ.toString()) + ";" 
			+ 'const Λmaker=' + JSON.stringify(e.created_by.Λ.toString()) + ";" 
			+ startupInitCode
			+ invokePrerun
*/
			, {
				//eval : true,
				//execArgv: ['--input-type=module'],  // this is assumed from the filename (do I need this to be memory resident?)
				execArgv: ["--experimental-vm-modules"//'--input-type=module' 
					//	,'--import sack.vfs/import'
					],
			   workerData : { Λ: id },
				stderr:true,
				stdin:true,
				stdout:true,
			})
		//console.log( "WOrker started?" );
		thread.worker.on("message",processMessage);

		thread.worker.stdout.on('data', (chunk)=> {
			( (string)=>{
				thread.worker.postMessage( {op:"out",out:string});
			}  )( chunk.toString('utf8') );
			}
		)
		thread.worker.on('error', (error)=>{
			console.log( "Error from thread:", error );
		});
		thread.worker.on('exit', (code) => {
			if (code !== 0);
				console.log(`Worker stopped with exit code ${code}`);
		});
		return new Promise( (res,rej)=>{
			resolveThread = res;
		})
	}else {
		console.trace( "This would have to call the main scheduler to create a thread... ");
	}
	console.log( "Returning promise for thread, without worker(?)");
	return Promise.resolve( thread );
}
export default {WakeEntity}
export {WakeEntity};
