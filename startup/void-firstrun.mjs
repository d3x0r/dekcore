

const args = process.argv;
let startScript = "./startup.mjs";
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

import Entity from "../lib/Entity/entity.mjs"
//console.log( "ENTITY:", Entity );

function BigBang() {
	//console.log( "Config:", JSOX.stringify( config, null, "\t" ) );
	if( config.run['The Void'] ) {
		console.log( "System has already been pre-initialized, please startup using void-run.js" );
		const promisedVoid = fc.get( config.run['The Void'] )
			.then( (theVoid)=>fc.map( theVoid, {id:config.run['The Void']} )	)
			.then( (theVoid)=>fc.get( config.run["MOOSE"] ) )
			.then( (MOOSE)=>{
				console.log( "No resume is available..." );
				//process.stdin.pipe( MOOSE.thread.worker.stdin );
				MOOSE.resume()
			} );
		return;
	}

	console.log( "Creating the void....");
	Entity.create( null, "The Void", "Glistening transparent black clouds swirl in the dark.", (o)=>{
		//console.log( "Void is null?", o );
		const theVoid = o;
		o.saved = true;
		o.saved.then( (id)=>{
			config.run['The Void'] = id; // o.V should also equal ID...

			o.create( "MOOSE", "Master Operator of System Entites.", (o)=>{
				// o changes here to MOOSE
				o.saved = true;
			console.log( "This should save the void with MOOSE in it...", theVoid.contains );
				theVoid.saved = true;
				o.saved.then( (id)=>{
					config.run.MOOSE = id;//o.Λ.toString();

					config.commit().then( ()=>{
						console.log( "Doing wake... does it not go?" );
						o.wake().then( (thread)=>{
							process.stdin.pipe( thread.worker.stdin );
							console.log( "What? Loading startscript?", startScript );
							o.import( startScript ).then( (r)=>{
								// r is a number that is the index of the require...
								//console.log( "Hmm, what doe shtis result?", r );
								o.save();
							});
						}).catch( (err) =>{
							console.log( "MOOSE Startup Wake failed:", err );
						})
					}).catch(err=>console.log("ERR?",err))

				}).catch(err=>console.log("ERR?",err))
			})
			//o.create( "MOOSE-HTTP", "(HTTP)Master Operator of System Entites.", (o)=>{
					//o.sandbox.require( "startupWeb.js" );
			//})
		}).catch(err=>console.log("ERR?",err))
	} );
	//});
}

//------------- some initial startup modes
config.start( BigBang );
config.resume();

