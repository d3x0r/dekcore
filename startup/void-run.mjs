

var args = process.argv;
var startScript = "startup.mjs";
for( var arg = 2; arg < args.length; args++ ) {
	if( args[arg][0] == '-' ) {
		if( args[arg][0] === '-start' ) {
			startScript = args[arg+1];
			arg++;
		}
	}
}


import config from "../lib/config/config.mjs"
import fc from "../lib/file-storage/file_cluster.mjs"
//import Entity from "../lib/Entity/entity.mjs"

function BigBang() {
	if( !config.run['The Void'] ) {
		console.log( "System has not been pre-initialized, please startup using void-firstrun.js" );
		return;
	}
	//console.log( "Config:", JSOX.stringify( config, null, "\t" ) );
	fc.get( config.run['The Void'] ).then( (o)=>{
		//config.run.MOOSE = "FMaZXHCSOkNoaKu_";
		fc.get( config.run.MOOSE ).then( (o)=>{
			o.wake().then( (thread)=>{
				process.stdin.pipe( thread.worker.stdin );
			}).catch( (err) =>{
				console.log( "MOOSE Startup Wake failed:", err );
			})
		} );
	} );

}

config.start( BigBang );
config.resume();

