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
const Λ = wt.workerData.Λ;

//const sack = require( 'sack.vfs' );
sack.log( util.format( "RUNNING?", process.version ) );


sack.Volume.Thread.accept( Λ, (ident,hostedVolume)=>{ 
	//console.log( "caught nativedisk" );
	sandbox.nativeDisk = hostedVolume 
});



import vm from "vm";


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


const sandbox = vm.createContext( {
    Λ : Λ
	, config : null
	, sandbox : null
	, Function : Function
	, eval: eval_
//	, import: import
	, require
	, module: {
		   exports : null
		}
	, exports : {}
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
	sack.log( util.format( "sandboxInit.mjs:Unhandled Rejection", err, '\n'+new Error() ) );
} );
process.on('unhandledException', err=>{
	sack.log( util.format( "sandboxInit.mjs:Unhandled Exception", err, '\n'+new Error() ) );
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

import {findModule} from "./nodeUtils.mjs"
const imports = new Map();
const importing = [];  // treat this as a stack....


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
	const result = runFile( "../lib/Sentience/sandboxPrerun.mjs" );
	//return wrapModule( module );


console.log( "vm ran... and we should be done?" );
//import( "./sandboxPrerun.mjs" );

result.result;