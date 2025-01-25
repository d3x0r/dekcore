
const yes = import("node:fs").then(({readFile}) => readFile instanceof Function)
process.stdout.write( "PING?" );
console.log( "Work1:", yes );

import { parentPort} from "worker_threads";

import { Script, constants, createContext } from 'node:vm';

const script = new Script(
  'import("node:fs").then(({readFile}) => readFile instanceof Function)',
  { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER });

const context = createContext( {}, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } );

const a = await script.runInThisContext();
parentPort.postMessage( {op:"log", f:["script 1", a] } );

const b = await script.runInContext( context, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER } );
parentPort.postMessage( {op:"log", f:["script 2", b] } );


