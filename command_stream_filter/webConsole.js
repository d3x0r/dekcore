

//const Entity = require( '../Entity/entity.js');

const util = await require('util')
const stream = await require('stream')

var sack = await require( "sack.vfs" );
const JSOX = sack.JSOX;
const path = await require( "path" );

//const shell = await require( "../Sentience/shell.js" );
//doLog( util.format("What sort of require?", require.toString() ));

const root = await require.resolve("./command_stream_filter/ui");

//var disk = sack.Volume();
//var disk = this.nativeDisk;
//console.log( "Disk failed, right?", disk, this );
//var myDisk = sack.Volume( "myDisk" );

//console.warn( "Disk is open in:", root, disk.dir() );


function createSpawnServer( sandbox ) {

	//console.warn( "Got 'sandbox...", sandbox.name );
	options = sandbox || {};
	var _this = this;

	//  this.console = openConsole( _this.push.bind(_this) );

	//options.decodeStrings = false;
	stream.Duplex.call(this,options)
	

	var serverOpts;
	const PORT = process.env.PORT || 5000
	var server = sack.WebSocket.Server( serverOpts = { port: PORT } )
	console.warn( "serving on " + serverOpts.port + " at " + root);

	server.onrequest = function( req, res ) {
		var ip = ( req.headers && req.headers['x-forwarded-for'] ) ||
			req.connection.remoteAddress ||
			req.socket.remoteAddress ||
			req.connection.socket.remoteAddress;
		//ws.clientAddress = ip;

		let reqUrl = req.url;
	
		let pathname = path.dirname( reqUrl );
		doLog( "Received request:", req.url, pathname );
		let useRoot = root;
		if( pathname == "/node_modules/@d3x0r/popups" ) {
			reqUrl = reqUrl.substr(1);
			useRoot = "";
			doLog( "Here:", reqUrl );
		}
		if( pathname == "/node_modules/jsox/lib" ) {
			reqUrl = reqUrl.substr(1);
			useRoot = "";
			doLog( "Here:", reqUrl );
		}
		if( pathname == "/Sentience/node_modules/jsox/lib" ) {
			reqUrl = reqUrl.substr(1+10);
			useRoot = "";
			doLog( "Here:", reqUrl );
		}
		if( pathname == "/util" ) {
			reqUrl = reqUrl.substr(1);
			useRoot = "";
			doLog( "Here:", reqUrl );
		}
		if( pathname == "/Sentience" ) {
			reqUrl = reqUrl.substr(1);
			useRoot = "";
			doLog( "Here:", reqUrl );
		}
		if( reqUrl === "/" ) reqUrl = "/index.html";
		var filePath = useRoot + unescape(reqUrl);
		//console.warn( "Path? failed?", filePath, path );
		console.log( "using:", filePath );
		var parts = filePath.split("." );
		var extname = path.extname( filePath );//parts.length?parts[parts.length-1]:'';
		//var extname = path.extname(filePath);
		var contentType = 'text/html';
		switch (extname) {
			case '.js':
			case '.mjs':
				contentType = 'text/javascript';
				break;
			case '.css':
				contentType = 'text/css';
				break;
			case '.json':
				contentType = 'application/json';
				break;
			case '.png':
				contentType = 'image/png';
				break;
			case '.jpg':
				contentType = 'image/jpg';
				break;
			case '.wav':
				contentType = 'audio/wav';
				break;
					case '.crt':
							contentType = 'application/x-x509-ca-cert';
							break;
					case '.pem':
							contentType = 'application/x-pem-file';
							break;
					case '.wasm': case 'asm':
						contentType = 'application/wasm';
							break;
		}
		if( nativeDisk.exists( filePath ) ) {
			res.writeHead(200, { 'Content-Type': contentType });
			//console.warn( "Read:", "." + req.url );
			res.end( nativeDisk.read( filePath ) );
		} else {
			console.warn( "Failed request: ", req );
			res.writeHead( 404 );
			res.end( "<HTML><HEAD><TITLE>404</TITLE></HEAD><BODY>Resource Not Found...</BODY></HTML>");
		}
	} ;
	let counter = 0;
	server.onaccept = async function (conn) {
		const protocol = conn.headers['Sec-WebSocket-Protocol'];
		
		//sack.log( util.format("Connection received with : ", conn.headers['Sec-WebSocket-Protocol'], " path:", conn.url) );
		conn.block(); // need to do this before async returns.
		
		create( await name+":"+counter++, await description).then( (e)=>{
			//sack.log( "created new entity... waking it up...")
			if( protocol === "EntityControl" ) {
				e.wake(false).then( ()=>{
					//sack.log( "Tell it to require web connection startup")
					e.require(  "./startupWebConnection.js" ).then( ()=>{
						if( !conn.post( e.Λ ) )
						{
							console.log( "Post failed... listener is not setup yet..." );
						}
					})
				})
			} else if( protocol === "EntityRemote" )	{
				e.wake(true); // allow core entity to post direct
				function tick() {
					if( !conn.post( e.Λ ) ) // throw to the core
					{
						console.log( "Post failed... listener is not setup yet..." );
						setTimeout( tick, 1 );
					}
				}
				setTimeout( tick, 1 );

			}
		} );
	} ;

	server.onconnect = function (ws) {
		var pend = [];			
		console.log( "OnConnect event too??")
	} ;
}


util.inherits(createSpawnServer, stream.Duplex)

createSpawnServer.prototype._read = function( size ) {
	console.trace( "webConsole Server:Read called...", size );  // 16384 by default... 
}
createSpawnServer.prototype._write = function( size ) {
	console.warn( "webConsole Server:This is lost output Write called...", size );  // 16384 by default... 
}


function Filter() {
	
	var tmp = {
        	filter : new createSpawnServer( this )
        	, connectInput(stream) { 
                	stream.pipe( this.filter );
                }
                ,connectOutput(stream) { 
                	this.filter.pipe( stream );
                } 
        };
        return tmp;

}

exports.Filter = Filter.bind(this);  // bind this to the filter.

if( !module.parent ) {
	//openServer( null );//newConsole( {} );
}

