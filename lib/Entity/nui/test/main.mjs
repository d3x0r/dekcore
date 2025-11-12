import {entityProtocol} from "../protocol.mjs"
//console.log( "protocol:", entityProtocol );

entityProtocol.resume().then( getService ).catch( ()=>{
	return entityProtocol.login( "d3x\\/\\/4r3:service", "password" ).then( getService )
		.catch( (err)=>{ 
			console.log( "Failed:", err ); 
			if( err === "Login Failed" ) {
				return entityProtocol.create( "d3x\\/\\/4r3:service", "password" ).then( getService );
			}

		} )
} );


function getService() {
	return entityProtocol.requestService( ).then( 
		console.log( "Okay, now what?" )
	);

}