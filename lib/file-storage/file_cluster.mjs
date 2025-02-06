/**
* this module currently uses a database connection for object storage... clearer to see operations.
* this also just uses object storage interface
*/

const debug_ = false;
import fs from 'fs';
import {sack } from  'sack.vfs';
const OS = sack.ObjectStorage;

// or system odbc driver interface?
const DB = sack.DB( process.env.DSN || "maria-dekcore" );

DB.do( "delete from os" );

const objectStorage = new sack.ObjectStorage( DB );

import config from "../config/config.mjs" ;


const fc_local = {
	authorities : [],
	store : null,
	root : null,
}

var inited = false;


class FileCluster {
	constructor() {
	}

	static init() {
		return new Promise( (resume, stop)=>{
			if( inited ) return;
			//let cvolName;

			//vol.unlink( 'core/' + config.Λ );
			//cvol = vfs.ObjectStorage( null, cvolName = './core/' + config.Λ );
			(fc_local.store = objectStorage /*vfs.ObjectStorage( cvol, "storage.os" ) */)
				.getRoot()
					.then( (dir)=>{
						fc_local.root = dir
						console.log( "Resume waiter on init...");
						resume();
				} );
			if( debug_ ) {
				fc_local.store.dir().then( (files)=>console.log( "storage dir:", files ));
			}
			process.on( 'exit', ()=>{
				fc_local.store.flush();
				//cvol.flush();
				console.trace( "Exit event in file cluster" );
			})
			
			inited = true;		
		});
	}
	static async Store( id ){
		console.log( "storage is shared, not private, get root might leak..." );
		//throw new Error( "cvol doesn't exist for this store to work." );
		// this is allocated in a single ObjectStorage as this ID...
		// becomes a storage unit for a sentience...
		//return new sack.ObjectStorage( cvol, id );
		return { objectStorage, root: await ( fc_local.root.find( id )?fc_local.root.open(id):fc_local.root.create( id ) ) } ;
	}
	static addAuthority( addr ) {
		fc_local.authorities.push( addr );
	}
	static put( o, opts ) {
       	return fc_local.store.put( o, opts );
	}
	static get( opts ) {
       	return fc_local.store.get( opts );
	}
	static addEncoders( encoders ) {
		return fc_local.store.addEncoders( encoders );
	}
	static addDecoders( coders ) {
		return fc_local.store.addDecoders( coders );
	}
	static map( o, opts ) { return fc_local.store.map( o, opts ) ; }
	static async store( filename, object ) {
		var fileName;
		if( !object ){
			console.log( "Nothing to store?");
			return;
		}
		//console.log( typeof filename )
		//console.log( 'storing object : ', object, Object.keys( object ) );
		//console.log( 'storing object : ', object.toString() );
		//console.trace( "storing into : ", filename, object, callback );
		if( typeof( filename ) == 'string' ) {
			 fileName = filename
			 return fc_local.root.has(fileName ).then( has=>{
					let file = null;
					if( has )
						file = fc_local.root.open( fileName )
					else 
						file = fc_local.root.create( fileName )

					return file.then( file=>file.write( object ) )
			} );
		} else {
			return fc_local.store.put( filename );
		}
		return fc_local.root.open( fileName ).then( file=>file.write( object ) );
	}
	static reloadFrom( pathobject, callback ) {
		if( pathobject.Λ )
			if( !pathobject.ΛfsPath )
				pathobject.ΛfsPath = GetFilename( pathobject );
			console.log( "readdir of, ", pathobject.ΛfsPath+"Λ")
			//fs.readdir(  pathobject.ΛfsPath+"Λ", callback );
	}
	static reload(filename){
		return fc_local.root.has( filename ).then ( has=>{
			if( has ) 
				return fc_local.root.open( filename ).then( file=>file.read() );
			return null;
		} );
	}

	mkdir= mkdir;
}


FileCluster.Utf8ArrayToStr = function(typedArray) {
	var out, i, len, c;
	var char2, char3;
	var array = new Uint8Array( typedArray );
	out = "";
	len = array.length;
	i = 0;
	while(i < len) {
	c = array[i++];
	switch(c >> 4)
	{
	  case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
		// 0xxxxxxx
		out += String.fromCharCode(c);
		break;
	  case 12: case 13:
		// 110x xxxx   10xx xxxx
		char2 = array[i++];
		out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
		break;
	  case 14:
		// 1110 xxxx  10xx xxxx  10xx xxxx
		char2 = array[i++];
		char3 = array[i++];
		out += String.fromCharCode(((c & 0x0F) << 12) |
					   ((char2 & 0x3F) << 6) |
					   ((char3 & 0x3F) << 0));
		break;
	}
	}

	return out;
}

function GetFilename( oid )
{
	if( !oid.ΛfsName ) {
		oid.ΛfsName = "Λ/" + oid.Λ;//.substring( 0, 5 ) + "-" + oid.Λ.substring( 5,10 ) + "-" + oid.Λ.substring( 10 );
		//console.log( "GetFilename is ", oid.ΛfsName, " for ",oid);
	}
	return oid.ΛfsName;
}

function GetObjectFilename( oid )
{
	var leader = "";
	if( oid.contained )
		if( oid.contained ) {
			if( oid.contained.ΛfsPath )
				leader = oid.contained.ΛfsPath;
			else
				leader =  ( oid.contained.Λfspath = oid.contained._.substring( 0, 5 ) + "/" + oid.contained._.substring( 5,10 ) + "/" +  oid.contained._.substring( 10 ) )
			leader += ".content/";
		}
	console.log( "object filename from: ", oid );;
	var char =  leader.join( oid._.substring( 0, 5 ) + "/" + oid._.substring( 5,10 ) + "/" +  oid._.substring( 10 ));
	console.log( "joined filename:", char);
	return char;
}

export {FileCluster};
export default FileCluster;
