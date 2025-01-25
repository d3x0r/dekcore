// This source is loaded, and appended with sandboxPrerun.js
Error.stackTraceLimit = Infinity;

import util from "util";

import Module from "module";
const _require = Module.createRequire(import.meta.url);

import {sack} from "sack.vfs";

const console = { log( ...a) { const s = util.format( ...a ); for( let b = 0; b * 1024 < s.length; b++ ) sack.log( s.slice( b*1024,(b+1)*1024) ) }
                , trace(...a) { sack.log( util.format( new Error().stack ) + util.format( ...a ) ) } 
                };

console.log( "Worker Module:", import.meta );

sack.log( util.format( "worker init global:", globalThis ) ); 

import wt from 'node:worker_threads'
const Λ = wt.workerData.Λ;

//const sack = require( 'sack.vfs' );
sack.log( util.format( "RUNNING?", process.version ) );


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

function Function() {
    throw new Error( "Please use other code import methods.");
}
function eval_() {
    throw new Error( "Please use other code import methods.");
}


const sandboxInit = {
    Λ : "uniqueId"//Λ.toString()
	, config : null
/*	, sandbox : null

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
*/
};
//console.log( "Adding u8xor?", sandbox.idGen );
//sandbox.idGen.u8xor = u8xor;
sandboxInit.sandbox = sandboxInit;

/* Seal Sandbox */
if(0)
[/*"import",*/"eval", "Function", /*"module",*/ "console", "process", "require", "sandbox", "fs", "vm"].forEach(key => {
    if( key in sandbox )
	    Object.defineProperty(sandbox, key, { enumerable: false, writable: true, configurable: false });
});
	


process.on('unhandledRejection', err=>{
	sack.log( util.format( "sandboxInit2.mjs:Unhandled Rejection", err, '\n'+new Error() ) );
} );
process.on('unhandledException', err=>{
	sack.log( util.format( "sandboxInit2.mjs:Unhandled Exception", err, '\n'+new Error() ) );
} );


const disk = sack.Volume();

const myPath = import.meta.url.split(/\/|\\/g);
const tmpPath = myPath.slice();
tmpPath.splice( 0, 3 );
tmpPath.splice( tmpPath.length-1, 1 );
const appRoot = (process.platform==="win32"?"":'/')+tmpPath.slice(0).join( '/' );
const parentRoot = (process.platform==="win32"?"":'/')+tmpPath.slice(0,-2).join( '/' );


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

global.setSync('global', global, global.derefInto());

// We will create a basic `log` function for the new isolate to use.
global.setSync('log', function(...args) {
	//sack.log( "vm log util" );
	console.log(...args);
});

global.setSync('require', ivmRequire );


const sandboxKeys = Object.keys( sandboxInit );

if(0)
sandboxKeys.forEach( key=>{
		console.log( "Setting :", key, sandboxInit[key] );
		if( key === 'Λ' )
			global.setSync( key, sandboxInit.Λ.toString() );
		else
			global.setSync( key, sandboxInit[key] )
} )

context.evalSync('log("hello world")');

//module.instantiateSync( context, resolveCallback );
function runScript( filename, content, isModule ) {
	console.log( "running content in new module?", filename, isModule );
	if( isModule ) {
		const module = isolate.compileModuleSync( content, {filename:filename} );
		//console.log( "module state:", module ); // is a Module{}
		const inst = module.instantiate( context, ivmModuleLinker );
		//console.log( "Before eval module is:", module, inst );
		return inst.then( (inst)=>{
			const result = module.evaluateSync( { timeout: 1000 } );
			importing.pop();
			// module.release();
			console.log( "module resulted:", module.namespace, result );
			return module;
		} ).catch( err=>{
			console.log("instantiate failed:", filename, err );
		} );
	
	} else {

try {
		const script = isolate.compileScriptSync( content, {filename:filename} );
try {
		console.log(" Context has what by now?", context );
		const result = script.runSync( context, { timeout: 1000 } );
		console.log( "runScript result:", result );
		importing.pop();
// script.release();
		return result;//new ivm.Reference( result );
}catch(err) { console.log( "Script.run failed?", err ); }
}catch(err) { console.log( "Script.compilescript failed?", err ); }
	}
}

function ivmRunFile( filename, isModule ) {
try {
		const parts = filename.split( /[\/\\]/ );
		const fileParts = parts[parts.length-1].split('.');
		if( fileParts[fileParts.length-1] === "node" ) {
			// file found, result with ivm nativemodule.
			console.log( "*** Load native module:", filename );
			const module = new ivm.NativeModule(filename);
			//console.log( "loaded got:", module, context );
			const m2 = module.createSync(context);
			//console.log( "create got:", m2 );
			const dr = m2.derefInto();
			//console.log( "(Native Loaded)SOME DEBUG INFO IVM:(NativeModule,Reference,Dereference)", module, m2, dr );
			//console.trace( "Why isn't module returned here??" );
			return dr;//module;//_require( filename );
							
		} else {
			importing.push( { filename, path:parts.slice( 0, parts.length-1).join('/') } );
			const content = disk.read( filename ); if( content ) {
				const r = runScript( parts[parts.length-1], content.toString(), isModule );
				console.log( "Run result:", r );
				return r;
			}
		}
}catch( err ) {
		console.log( "Failed:", err );
	}	
}

	async function ivmModuleLinker(specifier, referencingModule) {
		let usePath = specifier;
		const altPath = importing.length>0?(importing[importing.length-1].path + "/" + specifier):specifier;
		console.log( "linker:Specifier:", specifier, altPath );
		
		if( disk.exists( specifier ) || ( (usePath = altPath) && disk.exists( altPath ) ) ) {
			console.log( "specifier works?", usePath );
			const state = await ivmRunFile( usePath, true );
			sack.log( util.format( "ivm linker module is:", state ) );
			return state;
		}

		const path = findModule( specifier );
		if( path ) {
			sack.log( util.format( "loading:", path ) );
			const module = ivmRunFile( path, path.endsWith( ".mjs") );
			console.log( "File result is:", module );
			return module;
		}

		sack.log( util.format( "linker:Couldn't find local module - maybe it's a builtin? (this needs to be built as a proxy to the VM)", specifier ) );
		const module = await import(specifier );///vmric_import( specifier );
		console.log( "Imported(node):", module );
		return module;//await wrapModule( specifier, module );
			// otherwise here I have to also use sandbox to run any imported script sources.
			
		sack.log( util.format( "Got arguments in import:", specifier, referencingModule ) );
	}


	function ivmRequire( specifier ) {
		console.log( "IVMRquire : (this callback is outside of context)", specifier );
		let usePath = specifier;
		const altPath = importing[importing.length-1].path + "/" + specifier;
		
		if( disk.exists( specifier ) || ( (usePath = altPath) && disk.exists( altPath ) ) ) {
			if( !specifier.endsWith( ".node" ) ) {
				const content = disk.read( usePath );
				return content.toString();
			}
			
			console.log( "specifier works?", usePath );
			const state = ivmRunFile( usePath, specifier.endsWith( ".mjs")?true:false );
			sack.log( util.format( "ivmrequire module is:", state ) );
			
			return state;
		}

		const path = findModule( specifier );
		if( path ) {
			sack.log( util.format( "loading:", path ) );
			const module = ivmRunFile( path, false );
			return module;
			//return await wrapModule( specifier, module.module );
		}

		sack.log( util.format( "Couldn't find local module - maybe it's a builtin?", specifier ) );
		const module = _require(specifier );///vmric_import( specifier );
		//return await wrapModule( specifier, module );
			// otherwise here I have to also use sandbox to run any imported script sources.
			
		sack.log( util.format( "Got arguments in import:", specifier ) );
		return module;

	}

	
	function ivmRequire_ext( specifier ) {
		console.log( "IVMRquire : (this callback is outside of context)", specifier );
		let usePath = specifier;
		const altPath = importing[importing.length-1].path + "/" + specifier;
		
		if( disk.exists( specifier ) || ( (usePath = altPath) && disk.exists( altPath ) ) ) {
			console.log( "specifier works?", usePath );
			const state = ivmRunFile( usePath, false );
			sack.log( util.format( "ivmrequire module is:", state ) );
			
			return state;
		}

		const path = findModule( specifier );
		if( path ) {
			sack.log( util.format( "loading:", path ) );
			const module = ivmRunFile( path, false );
			return module;
			//return await wrapModule( specifier, module.module );
		}

		sack.log( util.format( "Couldn't find local module - maybe it's a builtin?", specifier ) );
		const module = _require(specifier );///vmric_import( specifier );
		//return await wrapModule( specifier, module );
			// otherwise here I have to also use sandbox to run any imported script sources.
			
		sack.log( util.format( "Got arguments in import:", specifier ) );
		return module;

	}


	console.log( "running VM with sandbox prerun...", ''+Λ.Λ );
await	runScript( "(init)", `
//import ivm from "isolated-vm";
globalThis.module = {exports:{}};
globalThis.exports = globalThis.module.exports;
globalThis.process = { env : {PATH:""}, on() { } };
globalThis.__dirname = ".";
globalThis.Λ = ${''+Λ.Λ};
const ivmRequire = globalThis.require;
const modules = new Map();

globalThis.require = (specifier)=>{
	const oldModule = modules.get( specifier );
	if( oldModule ) return oldModule;

	const module = {exports:{}};
	globalThis.module = module;
	log( "This is overridden require!", specifier );
	let r = ivmRequire( specifier );
	if( "string" === typeof r ) {
		try {
		log( "got a string to execute locally" );
		r = (new Function( r ))()
		log( "after creating and running function" );
		} catch( err) { sack.log( "an error happened" ) }
	}
	log( "Should have modulefilled in...", typeof module.exports,typeof r, typeof module.exports, new Error().stack.toString() );
	if( specifier.endsWith( ".node" ) )
		module.exports = r;

	modules.set( specifier, module );
	return module.exports;
};
log( "Init Completed?", Object.keys(globalThis) );
`, true ); // if not a module, should be run-sync

context.evalSync('log("hello world(2)")');

	console.log( "--------Init should be completed - and logged?!" );
	const result = await ivmModuleLinker( "../lib/Sentience/sandboxPrerun.ivm.mjs" );
	//return wrapModule( module );


console.log( "vm ran... and we should be done?", result );
//import( "./sandboxPrerun.mjs" );

result?.result;