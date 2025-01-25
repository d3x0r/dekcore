import { Script, constants, createContext, runInContext } from 'node:vm';
import vm from "vm";

import wt_ from "worker_threads";

//const idMan = require( '../id_manager.js');
const wt = ( wt_.isMainThread && wt_ );

const script = new Script(
  `import("node:fs").then(({readFile}) => readFile instanceof Function);`
	, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER }
);

const context = createContext( {}
								//		, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } 
								);

const a = await script.runInThisContext( /*{ importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER }*/ );
console.log( "script 1:", a );

const b = await script.runInContext( context /*, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER }*/ );
console.log( "script 2:", b );

const c = runInContext(  `import("node:fs").then(({readFile}) => readFile instanceof Function);`
		, context, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } );

console.log( "vm.runincontext :", c );

const w1 = new wt.Worker( 
				"./work1.mjs"
			, {
				stderr:true,
				stdin:true,
				stdout:true,
			})

w1.on( "message", (msg)=>{
	console.log( "message:", msg );
} );

console.log( "wait for w1?" );
if(0)
try {
const w2 = new wt.Worker( 
				'const a = await import("node:fs").then(({readFile}) => readFile instanceof Function); \
		import {parentPort} from "worker_threads"; parentPort.send( op:"log", f:["textScript", a] );'
			, {
				eval:true,
				stderr:true,
				stdin:true,
				stdout:true,
			})

w2.on( "message", (msg)=>{
	console.log( "message:", msg );
} );

} catch( err ) {
		console.log( "This fails, because await isn't top level here", err );
}

const w3 = new wt.Worker( 
				'const a = await import("node:fs").then(({readFile}) => readFile instanceof Function); \
		import {parentPort} from "worker_threads";   \
			parentPort.postMessage( {op:"log", f:["textScript 2", a] });'
			, {
				eval:true,
				execArgv : ['--input-type=module'],
				stderr:true,
				stdin:true,
				stdout:true,
			})
w3.on( "message", (msg)=>{
	console.log( "message:", msg );
} );

console.log( "Starting worker 4" );
const w4 = new wt.Worker( 
				'const a = await import("node:fs").then(({readFile}) => readFile instanceof Function); \
		import {parentPort} from "worker_threads";   \
		import vm from "vm"; \
		const sandbox = {data:"yes"}; \
		const context = vm.createContext( sandbox, { importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } ); \
          \
		const exampleCode = `let r; try {  r = import("node:fs").then(({readFile}) => readFile instanceof Function); } catch(err){ r = err }  r;`; parentPort.postMessage( { op:"log", f: exampleCode} ); \
		let b; \
		try { \
		   b = vm.runInContext(  exampleCode  \
				, sandbox, { importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } );        \
		} catch( err) { parentPort.postMessage( {op:"except", e:err} ) } \
          \
			parentPort.postMessage( {op:"log", f:["textScript done", a, b] });'
			, {
				eval:true,
				execArgv : ['--input-type=module'],
				stderr:true,
				stdin:true,
				stdout:true,
			})
w4.on( "message", (msg)=>{
	console.log( "message:", msg );
} );



setTimeout( ()=>{}, 1000 );