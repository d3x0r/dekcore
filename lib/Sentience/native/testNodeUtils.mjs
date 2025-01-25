
import {findModule} from "./nodeUtils.mjs"

const path = [ "sack.vfs", "sack.vfs/import", "jsox", "@d3x0r/popups" ];

path.forEach( p =>{
	const path = findModule( p );
	console.log( "Something:", path );
} );

path.forEach( p =>{
	const path = findModule( p, true );
	console.log( "Something:", path );
} );