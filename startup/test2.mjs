import wt_ from "worker_threads";

//const idMan = require( '../id_manager.js');
const wt = ( wt_.isMainThread && wt_ );


import { Script, constants } from 'node:vm';

const script = new Script(
  `import("node:fs").then(({readFile}) => readFile instanceof Function);`
	, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } );

		const script2 = new Script( 
         `let r; try { r=globalThis; 
				globalThis.isScriptBase = true; 
			r = import( "./test2m.mjs" ).then( (module)=>( {globalThis,module:module.default} ) ) } catch(err) { r = err } r;` 
			, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } ); 

console.log( "script 1:", await script.runInThisContext() );


console.log( "script 2:", await script2.runInThisContext() );

//		  `import("node:fs").then(({readFile}) => readFile instanceof Function);` 


console.log( "Starting worker 4" );
let workerScript = null;

const w4 = new wt.Worker( 
			workerScript =	'import {parentPort,workerData} from "worker_threads";   \
		import vm from "vm"; \
		const globalThis = workerData; \
		parentPort.postMessage( { op:"log" , f:globalThis } ); \
		const script = new vm.Script( \
         `let r; try { r=globalThis;   \
				globalThis.isScriptBase = true;   \
			r = import( "./test2m.mjs" ).then( (module)=>( {globalThis,m:module.default} ) ) } catch(err) { r = err } r;`   \
			, { importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } ); \
	 \
		parentPort.postMessage( {op:"vmResult", r: await script.runInThisContext()} ); \
    \
      '
			, {
				eval:true,
				execArgv : ['--input-type=module'],
			workerData : { context: "maybe" },
				stderr:true,
				stdin:true,
				stdout:true,
				
			})
w4.on('error', err => {
  console.log('error happened on the worker', err, workerScript);
});
w4.on( "message", (msg)=>{
	console.log( "message:", msg );
} );

