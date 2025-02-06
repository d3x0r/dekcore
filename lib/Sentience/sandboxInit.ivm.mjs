// This source is loaded, and appended with sandboxPrerun.js
Error.stackTraceLimit = Infinity;

import util from "util";

import Module from "module";
const _require = Module.createRequire(import.meta.url);

import {sack} from "sack.vfs";

const console = { log( ...a) { sack.log( util.format( ...a ) ) } };

console.log( "Worker Module:", import.meta );

sack.log( util.format( "worker init global:", globalThis ) ); 

import wt from 'node:worker_threads'

const coreThreadEventer = wt.parentPort;
const Λ = wt.workerData.Λ;
coreThreadEventer.on("message", relayMessage);

//const sack = require( 'sack.vfs' );
sack.log( util.format( "RUNNING?", process.version, wt.isMainThread ) );


sack.Volume.Thread.accept( Λ, (ident,hostedVolume)=>{ 
	//console.log( "caught nativedisk" );
	sandbox.nativeDisk = hostedVolume 
});



import vm from "vm";
import ivm from "isolated-vm";


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

function processMessage(msg, stream) {
	if ("string" === typeof msg) {
		console.trace("String input");
	}

	function reply(msg) {
		if (stream)
			process.stdout.write(JSOX.stringify(msg));
		else
			coreThreadEventer.postMessage(msg);
	}

	if (msg.op === "run") {
		var prior_execution = codeStack.find(c => c.path === msg.file.path);
		if (prior_execution)
			doLog("Duplicate run of the same code; shouldn't we just return the prior?  I mean sure, maybe the filter of this should be higher?", msg.file, codeStack);
		_debug_command_run && doLog("Run some code...", codeStack, msg.file);
		var res;
		try {
			const code = { file: msg.file, id:msg.id, result: null }
			var codeIndex = codeStack.push(code)-1;
			//doLog( "RunInfo: " + msg.file );
			//console.log( "run code(delayed):"+ msg.code );			
console.log( "Running code with import dynamic:", vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER );
			var res = vmric(msg.code, sandbox.sandbox, { importModuleDynamically : vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER, filename: msg.file.src, lineOffset: 0, columnOffset: 0, displayErrors: true });
console.log( "Ran(running?) the code...", res ); 
			if (res && (res instanceof Promise || Promise.resolve(res) === res || ("undefined" !== typeof res.then)))
				res.then(
					(realResult) => {
						_debug_command_run && doLog( "Promised result from code:", realResult );
						//_debug_commands &&
						//doLog( "And post result.", pendingRequire, realResult );
						if (pendingRequire) {
							_debug_requires && sack.log( util.format("This is in a pending require for:?", code.file.src) )
							code.result = realResult;
							reply({ op: "run", ret: codeIndex, id: msg.id });
						} else
							reply({ op: "run", ret: realResult, id: msg.id });
					}
				).catch(err => {
					_debug_command_run && doLog( "Error caught from async code:", err );
					if (err)
						reply(({
							op: "error"
							, file: msg.file.src, error: err.toString() + (err.stack ? err.stack.toString() : "NoStack"), id: msg.id
						}));
					else
						reply(({ op: "error", file: msg.file.src, error: "No Error!", id: msg.id }));
				});
			else {
				if (pendingRequire) {
					console.log( "Direct response:", res );
					code.result = res;
				}
				doLog("And post sync result.", res);
				reply(({ op: "run", ret: res, id: msg.id }));
			}
			//doLog( "Did it?", sandbox );
			return;
		} catch (err) {
			doLog("Run Failed:", err, msg.code)
			reply(({ op: "error", error: err.toString(), stack: err.stack, id: msg.id }));
			return;
		}
	} else 
	if (msg.op === "ing") {
		return sandbox.ing(msg.ing, msg.args);
	} else if (msg.op === "On") {
		console.log( "capital On ", msg );
		var e = objects.get(msg.on);
		switch (true) {
			case "name" === msg.On:
				myName = msg.args;
				e.cache.name = msg.args;
				break;
			case "description" === msg.On:
				e.cache.desc = msg.args;
				break;
		}
	} else if (msg.op === "out") {
		if (msg.out) {
			if (self.io.output)
				self.io.output(msg.out);
			else{
				//msg.out = msg.out + (new Error().stack).toString();
				coreThreadEventer.postMessage(msg);
			}
		}
		//reply(msg.out);
		return;
	} else if (msg.op === "on") {
		_debug_event_input && doLog( myName, ":emit event:", msg);
		var onEnt = (msg.Λ && makeEntity(msg.Λ)) || entity;
		
		// this handles argument conversion for known types
		// it also calls updates of internal cache

		_debug_event_input && onEnt.name.then( name=>console.log( "(delayed emit message)on:", msg.on, "to", name, onEnt.name, msg.args.name ) );
		switch (true) {
			// this is an internal function, and object does not get
			// notified for events.
			case "enable" === msg.on:
				var onEnt = msg.args[0] && makeEntity(msg.args[0]);
				onEnt.enable( msg.args[1] );
				return;
			case "name" === msg.on:
				onEnt.cache.name = msg.args;
				myName = msg.args;
				//msg.args = makeEntity( msg.args)
				break;
			case "rebase" === msg.on:
				msg.args = makeEntity(msg.args);
				console.log( "rebase function not functioning");
				break;
			case "debase" === msg.on:
				msg.args = makeEntity(msg.args);
				console.log( "debase function not functioning");
				break;
			case "joined" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.joined( msg.args );
				break;
			case "parted" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.part(msg.args);
				break;
			case "placed" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.placed(msg.args);
				break;
				/*
			case "displaced" === msg.on:
				//msg.args = makeEntity( msg.args );
				break;
				*/
			case "stored" === msg.on:
				onEnt.cache.near.store(makeEntity(msg.args));
				
				break;
				
			case "lost" === msg.on:
				msg.args = makeEntity(msg.args);
				const real = onEnt.cache.real;
				if( real ) {
					onEnt.cache.near.lose(msg.args);
					doLog( "cache now is:",myName, onEnt.cache.real );
				}
				break;
				
			case "attached" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.attached(msg.args);
				break;
			case "detached" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.detached(msg.args);
				break;
			case "created" === msg.on:
				msg.args = makeEntity(msg.args);
				//console.log( "Created Entty needs to be 'created'", onEnt, msg );
				if( onEnt.cache.near )
					onEnt.cache.near.created( msg.args )
				break;
			case "newListener" === msg.on:
				//msg.args = makeEntity( msg.args );
				break;
			default:
				console.log( "Event not handled:", msg );
				break;
		}
		//sack.log(util.format( "Emit event:", msg.on, msg.args ));
		return self.emit_(msg.on, msg.args );
	}
	//else
	//	doLog("will it find", msg, "in", pendingOps);

	var responseId = ("id" in msg) && pendingOps.findIndex(op => op.id === msg.id);
	if (responseId >= 0) {
		var response = pendingOps[responseId];
		//doLog( "Will splice...", responseId, msg, pendingOps)
		pendingOps.splice(responseId, 1);
		if (msg.op === 'f' || msg.op === 'g' || msg.op === 'e' || msg.op === 'h') {
			_debug_commands && doLog(util.format("command resolution:", msg, response));
			response.resolve(msg.ret);
		} else if (msg.op === 'error') {
			//_debug_commands && 
			doLog(util.format("command Reject.", msg, response));
			response.reject(msg.error);
		}
	} else {
		if (msg.op !== "run")
			doLog("didn't find matched response?", msg.op, msg)
	}

}

function Function() {
    throw new Error( "Please use other code import methods.");
}
function eval_() {
    throw new Error( "Please use other code import methods.");
}


const sandbox = vm.createContext( {
    Λ : Λ
	, config : null
	, sandbox : null
	, Function : Function
	, eval: eval_
//	, import: import
	, require
	, storage: null // privateStorage
	, disk : null
	, nativeDisk : null //physicalDisk
	, console:console
	, process: process
	//, idGen : idGenModule
	, _setTimeout : setTimeout
	, _clearTimeout : clearTimeout
	, _setInterval : setInterval
	, onInit(cb) {
	    if( initDispatched)cb();
	    else pendingInit.push(cb);
	}
	//, Buffer: Buffer
	, vmric:(a,b)=>vm.runInContext(a,sandbox,b)
	//, crypto: crypto
	//, config(...args) { returnpost("config",...args); })(); }  // sram type config; reloaded at startup; saved on demand
} );
//console.log( "Adding u8xor?", sandbox.idGen );
//sandbox.idGen.u8xor = u8xor;
sandbox.sandbox = sandbox;

/* Seal Sandbox */
[/*"import",*/"eval", "Function", /*"module",*/ "console", "process", "require", "sandbox", "fs", "vm"].forEach(key => {
    if( key in sandbox )
	    Object.defineProperty(sandbox, key, { enumerable: false, writable: true, configurable: false });
});
	


process.on('unhandledRejection', err=>{
	sack.log( util.format( "sandboxInit.ivm.mjs:Unhandled Rejection", err, '\n'+new Error() ) );
} );
process.on('unhandledException', err=>{
	sack.log( util.format( "sandboxInit.ivm.mjs:Unhandled Exception", err, '\n'+new Error() ) );
} );


const disk = sack.Volume();

const myPath = import.meta.url.split(/\/|\\/g);
const tmpPath = myPath.slice();
tmpPath.splice( 0, 3 );
tmpPath.splice( tmpPath.length-1, 1 );
const appRoot = (process.platform==="win32"?"":'/')+tmpPath.slice(0).join( '/' );
const parentRoot = (process.platform==="win32"?"":'/')+tmpPath.slice(0,-2).join( '/' );

const startupPrerunCode_zzz = disk.read( appRoot + "/sandboxPrerun.js" ).toString()
		.replace( /import\s*{([^}]*)}\s*from\s*["']([^"']*)["']/g, "const {$1}=(await import(\"$2\"))" )
		.replace( /import\s*\*\s*as\s*([^ ]*)\s*from\s*["']([^"']*)["']/g, "const $1=(await import(\"$2\"))" )
		.replace( /import(.*(?!from))\s*from\s*["']([^"']*)["']/g, "const $1=(await import(\"$2\")).default" )
		;
const startupPrerunCode = 
		'import("util").then( (module)=>{ return import( "sack.vfs" ).then( (sm)=>{ sm.sack.log( module.default.format( "global this?", globalThis ) ) } ) } );\n' +

		"import('"+ "file://"+appRoot+"/sandboxPrerun.mjs" + "')";
console.log( "Prerun ....\n", startupPrerunCode );


//----------------------------------------------------------
//--------------- ivm -------------------------------------
import {findModule} from "./nodeUtils.mjs"
const imports = new Map();
const importing = [];  // treat this as a stack....

const isolate = new ivm.Isolate( {
			//memoryLimit:128
			//
		} );
const context = isolate.createContextSync();
let global = context.global;
let data = new ivm.ExternalCopy({ isolate, context, global });

global.setSync('global', global.derefInto());

// We will create a basic `log` function for the new isolate to use.
global.setSync('log', function(...args) {
	console.log( "Global Function log is called and did something...", ...args );
	console.log(...args);
});
global.setSync('emit', function(op, e) {
	console.log(...args);
	if( "string" === typeof op ) coreThreadEventer.postMessage( op );
	else coreThreadEventer.postMessage( JSOX.stringify( { op, e } ) );
});
global.setSync('require', ivmRequire );

const sandboxKeys = Object.keys( sandbox );

sandboxKeys.forEach( key=>{
		console.log( "Setting :", key, sandbox[key] );
		if( key === 'Λ' ) 
			global.setSync( key, sandbox.Λ.toString() );
		else
			global.setSync( key, sandbox[key] )
} )

function invokeEvent( op, e ) {
	context.eval( `on(${JSON.stringify( op)},${e})` );
}

context.evalSync('log("hello world")');

//module.instantiateSync( context, resolveCallback );
function runScript( content, isModule ) {
	console.log( "running content in new module?", isModule );
	if( isModule ) {
		const module = isolate.compileModuleSync( content );
		console.log( "module state:", module ); // is a Module{}
		const inst = module.instantiate( context, ivmModuleLinker );
		console.log( "Before eval module is:", module, inst );
		return inst.then( (inst)=>{
			const result = module.evaluateSync( { timeout: 1000 } );
			importing.pop();
			// module.release();
			return result;
		} );
	
	} else {

		const script = isolate.compileScriptSync( content );
		const result = script.run( context, { timeout: 1000 } );
		importing.pop();
// script.release();
		return result;
	}
}

function ivmRunFile( filename, isModule ) {
		const parts = filename.split( /[\/\\]/ );
		const fileParts = parts[parts.length-1].split('.');
		importing.push( { filename, path:parts.slice( 0, parts.length-1).join('/') } );
		const content = disk.read( filename ); if( content ) {
			return runScript( content.toString(), isModule );
		}
	
}

	function ivmRequire( specifier ) {
		console.log( "IVMRquire : ", specifier );
		let usePath = specifier;
		const altPath = importing[importing.length-1].path + "/" + specifier;
		console.log( "require Specifier:", specifier );
		
		if( disk.exists( specifier ) || ( (usePath = altPath) && disk.exists( altPath ) ) ) {
			console.log( "specifier works?", usePath );
			const state = ivmRunFile( usePath, false );
			sack.log( util.format( "module is:", state.module, state.result ) );
			return state.module;
		}

		const path = findModule( specifier );
		if( path ) {
			sack.log( util.format( "loading:", path ) );
			const module = ivmRunFile( path, false );
			//return await wrapModule( specifier, module.module );
		}

		sack.log( util.format( "Couldn't find local module - maybe it's a builtin?", specifier ) );
		const module = _require(specifier );///vmric_import( specifier );
		//return await wrapModule( specifier, module );
			// otherwise here I have to also use sandbox to run any imported script sources.
			
		sack.log( util.format( "Got arguments in import:", specifier ) );
		return module;

	}

	async function ivmModuleLinker(specifier, referencingModule) {
		let usePath = specifier;
		const altPath = importing.length>0?(importing[importing.length-1].path + "/" + specifier):specifier;
		console.log( "linker:Specifier:", specifier, altPath );
		
		if( disk.exists( specifier ) || ( (usePath = altPath) && disk.exists( altPath ) ) ) {
			console.log( "specifier works?", usePath );
			const state = ivmRunFile( usePath, true );
			sack.log( util.format( "module is:", state.module, state.result ) );
			return state.module;
		}

		const path = findModule( specifier );
		if( path ) {
			sack.log( util.format( "loading:", path ) );
			const module = ivmRunFile( path, true );
			return module;
		}

		sack.log( util.format( "linker:Couldn't find local module - maybe it's a builtin?", specifier ) );
		const module = await import(specifier );///vmric_import( specifier );
		console.log( "Imported:", module );
		return module;//await wrapModule( specifier, module );
			// otherwise here I have to also use sandbox to run any imported script sources.
			
		sack.log( util.format( "Got arguments in import:", specifier, referencingModule ) );
	}


//module.run( context ).catch( err =>console.error(err ) );

//-------------------------------------------------------------
//-------------- Node  VM ----------------------------------------




	async function wrapModule( specifier, module ) {
      const exportNames = Object.keys(module);
      const imported = new vm.SyntheticModule(
        exportNames,
        function () {
          exportNames.forEach(key => imported.setExport(key, mod[key]));
        },
        { identifier: specifier, context: sandbox /*referencingModule.context*/ }
      );
      async function linker(specifier, referencingModule) {
		    // the desired logic...
		}

		await imported.link(linker);

      imports.set(specifier, imported);
      return imported;
      
	}

	function metaRequire( specifier ) {
		
	}

	function require( filename ) {
		const parts = filename.split( /[\/\\]/ );
		const fileParts = parts[parts.length-1].split('.');
		let result;
		if( fileParts[fileParts.length-1] === "node" ) {
			// binary module....
			return _require( filename );
		}
		
		console.log( "Handling sandbox require....", filename, importing );
		if( filename.startsWith( "./" ) || filename.startsWith( "../" ) || filename.startsWith( "/" ) ) {
			result = sandboxRequire( importing[importing.length-1].path + "/" + filename, sandbox );
		}else
			result = _require( filename );
		console.log( "Result of require:", result );
		console.log( "sandbox:", sandbox.exports, sandbox.module );
	}

	function runFile( filename ) {
		const parts = filename.split( /[\/\\]/ );
		const fileParts = parts[parts.length-1].split('.');
		importing.push( { filename, path:parts.slice( 0, parts.length-1).join('/') } );
		const content = disk.read( filename ); if( content ) {
			console.log( "Sandbox has stuff?", sandbox, sandbox.require,  importing );

				const module = new vm.SourceTextModule( content.toString(), {identifier:filename, context:sandbox} );
				const result = module.link( moduleLinker ).then( ()=>{
						sandbox.exports = {};
						sandbox.module.exports = sandbox.exports;
						module.evaluate().catch(err=>sack.log(util.format("Error in eval?", err )) ) 
						
					}).catch(err=>sack.log(util.format("Error in link?", err )));

			// should already be in a 1 second timeout
			//const res = code.runInContext( sandbox, { timeout: 1000 }  ); // limit to 1 second for now...
			//const res = vm.runInContext( startupPrerunCode, sandbox, {importModuleDynamically : vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER, filename:"sandboxPrerun.mjs"});
			console.log( "What sort of result do we get?", result );
			result.then( (a)=>{importing.pop(); return a} );
			return {module,result};
		}
		importing.pop();
		return null;
	}

	async function moduleLinker(specifier, referencingModule) {
		let usePath = specifier;
		const altPath = importing[importing.length-1].path + "/" + specifier;
		console.log( "Specifier:", specifier, referencingModule );
		
		if( disk.exists( specifier ) || ( (usePath = altPath) && disk.exists( altPath ) ) ) {
			console.log( "specifier works?", usePath );
			const state = runFile( usePath );
			sack.log( util.format( "module is:", state.module, state.result ) );
			return state.module;
		}

		const res = Module.resolve( specifier );
		console.log( "Node resolved as:", res );
		const path = findModule( specifier );
		if( path ) {
			sack.log( util.format( "loading:", path ) );
			const module = runFile( path );
			return await wrapModule( specifier, module.module );
		}

		sack.log( util.format( "Couldn't find local module - maybe it's a builtin?", specifier ) );
		const module = await import(specifier );///vmric_import( specifier );
		return await wrapModule( specifier, module );
			// otherwise here I have to also use sandbox to run any imported script sources.
			
		sack.log( util.format( "Got arguments in import:", specifier, referencingModule ) );
	}

	
	async function importModuleDynamically(specifier, referrer, importAttributes) {
		console.log( "Specifier:", specifier, referrer, importing );
						if( disk.exists( specifier ) ) {
			console.log( "specifier works?", specifier );
							const module = runFile( specifier );
							sack.log( util.format( "module is:", module ) );
						}
						const path = findModule( specifier, referrer );
						if( path ) {
							sack.log( util.format( "loading:", path, referrer ) );
							const module = await runFile( path );
							return await wrapModule( specifier, module );
						}
						sack.log( util.format( "Couldn't find local module - maybe it's a builtin?", specifier ) );
							const module = await import(specifier );///vmric_import( specifier );
							return await wrapModule( specifier, module );
							// otherwise here I have to also use sandbox to run any imported script sources.
							
							sack.log( util.format( "Got arguments in import:", specifier, referrer, importAttributes ) );
						}

	// recursively import modules using sandbox vm.runInContext (vmric)
	function vmric_import( filename ) {
		importing.push( filename );
		
		// this is a trash import, and... even though we get to catch it
		// the parent context is wrong.
		const script = "import("+ JSON.stringify(filename) + ")";

		const code = new vm.Script( script, {importModuleDynamically, filename } );
		const res = code.runInContext( sandbox, { timeout: 1000 }  ); // limit to 1 second for now...

		//const res = vm.runInContext( startupPrerunCode, sandbox, {importModuleDynamically : vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER, filename:"sandboxPrerun.mjs"});
		console.log( "What sort of result do we get?", res );
		res.then( (a)=>{importing.pop(); return a} );
		return res;
	}


	console.log( "running VM with sandbox prerun..." );
	const result = await ivmModuleLinker( "../lib/Sentience/sandboxPrerun.ivm.mjs" );
						//runFile( "../lib/Sentience/sandboxPrerun.mjs" );
	//return wrapModule( module );


console.log( "vm ran... and we should be done?", result );
//import( "./sandboxPrerun.mjs" );

function relayMessage( msg ) {
	console.log( "Relay message:", msg );
	invokeEvent( "message", msg );
}

// this is run in the worker... result.result is meaningless?
coreThreadEventer.postMessage( "{op:initDone}" );
console.log( "sandboxInit.ivm.mjs:Init done.", coreThreadEventer );

result.result;