
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

import wt_ from "worker_threads";

//const idMan = require( '../id_manager.js');
const wt = ( wt_.isMainThread && wt_ );


const disk = sack.Volume();

const myPath = import.meta.url.split(/\/|\\/g);
const tmpPath = myPath.slice();
tmpPath.splice( 0, 3 );
tmpPath.splice( tmpPath.length-1, 1 );
const appRoot = (process.platform==="win32"?"":'/')+tmpPath.slice(0).join( '/' );
const parentRoot = (process.platform==="win32"?"":'/')+tmpPath.slice(0,-2).join( '/' );
             console.log( "AppRoot is sentience right?", appRoot );


//??
const startupInitCode = disk.read( appRoot + "/sandboxInit.js" ).toString();
const startupPrerunCode = disk.read( appRoot + "/sandboxPrerun.js" ).toString()
		.replace( /import\s*{([^}]*)}\s*from\s*["']([^"']*)["']/g, "const {$1}=(await import(\"$2\"))" )
		.replace( /import\s*\*\s*as\s*([^ ]*)\s*from\s*["']([^"']*)["']/g, "const $1=(await import(\"$2\"))" )
		.replace( /import(.*(?!from))\s*from\s*["']([^"']*)["']/g, "const $1=(await import(\"$2\")).default" )
	
;

console.log( "Prerun:\n", startupPrerunCode );
