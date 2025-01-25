import { Script, constants } from 'node:vm';

const script = new Script(
  `import("node:fs").then(({readFile}) => readFile instanceof Function);`
	, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } );

console.log( "script 1:", await script.runInThisContext() );

