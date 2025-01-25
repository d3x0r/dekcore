


import { Script, constants, createContext } from 'node:vm';

const script = new Script(
    `globalThis;`
	//, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER }
	 );

const script2 = new Script( 
         `let r; try { r=globalThis; 
				globalThis.isScriptBase = true; 
			r =  import( "./test2m.mjs" ).then( (module)=>( {globalThis,module:module.default} ) ) } catch(err) { r = err } r;` 
			, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } 
		); 

const context = createContext( { myContext: "Yes" }
		, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } 
		);

//const context = vm.create

console.log( "script 1:", await script.runInContext(context) );
console.log( "script 2:", await script2.runInContext(context) );

