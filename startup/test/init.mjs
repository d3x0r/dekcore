// This source is loaded, and appended with sandboxPrerun.js
Error.stackTraceLimit = Infinity;

import util from "util";
import ivm from "isolated-vm";
import {sack} from "sack.vfs";
import {findModule} from "./nodeUtils.mjs"

const console = { log( ...a) { sack.log( util.format( ...a ) ) }
                , trace(...a) { sack.log( util.format( new Error().stack ) + util.format( ...a ) ) } 
                };

//const sack = require( 'sack.vfs' );
sack.log( util.format( "RUNNING?", process.version ) );



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
	console.log(...args);
});

global.setSync('require', ivmRequire );



context.evalSync('log("hello world")');

//module.instantiateSync( context, resolveCallback );
function runScript( filename, content, isModule ) {
	console.log( "running content in new module?", filename, isModule );
	if( isModule ) {
		const module = isolate.compileModuleSync( content );
		//console.log( "module state:", module ); // is a Module{}
		const inst = module.instantiate( context, ivmModuleLinker );
		//console.log( "Before eval module is:", module, inst );
		return inst.then( (inst)=>{
			const result = module.evaluateSync( { timeout: 1000 } );
			importing.pop();
			// module.release();
			console.log( "module resulted:", module.namespace, result );
			return result;
		} ).catch( err=>{
			console.log("instantiate failed:", filename, err );
		} );
	
	} else {

try {
		const script = isolate.compileScriptSync( content );
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
			const module = ivmRunFile( path, true );
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

	

	console.log( "running VM with sandbox prerun..." );
	runScript( "(init)", `
globalThis.module = {exports:{}};
globalThis.exports = globalThis.module.exports;
globalThis.process = { env : {PATH:""}, on() { } };
const ivmRequire = globalThis.require;
const modules = new Map();

globalThis.require = (specifier)=>{
	const oldModule = modules.get( specifier );
	if( oldModule ) return oldModule;

	const module = {exports:{}};
	globalThis.module = module;
	log( "This is overridden require!", specifier );
	const r = ivmRequire( specifier );
	log( "Should have modulefilled in...", Object.keys(module.exports), Object.keys(r), typeof module.exports, new Error().stack.toString() );
	if( specifier.endsWith( ".node" ) )
		module.export = r;

	modules.set( specifier, module );
	return r;
};
log( "Init Copmleted?", Object.keys(globalThis) );
`, false ); // if not a module, should be run-sync

//context.evalSync('log("hello world(2)")');


	console.log( "--------Init should be completed - and logged?!" );
	const result = await ivmModuleLinker( "./sandboxPrerun.ivm.mjs" );
	//return wrapModule( module );


console.log( "vm ran... and we should be done?", result );
//import( "./sandboxPrerun.mjs" );

result?.result;