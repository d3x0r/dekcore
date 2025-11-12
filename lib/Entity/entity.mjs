//doLog( "dirname is", __dirname );
// Entity events
//  on( 'create', (self)=>{  } )
//  on( 'restore', (self)=>{ } )
//  on( "attachted", ( self,toOther)=>{ })
//  on( "dropped", ( self, old_container )=>{ } )
//  on( "detached", (self, fromOther){ } )
// on( "contained", ( self ){ } )
// on( "relocated", ( self, old_container )=>{ } )
// on( "rebase", ( self )=>{ } )

// onWake after Sentient

// Entity Methods
// Entity( maker ) // returns Entity
// e.create( Object )  // returns new e
//   with maker as object


// e.grab( something[ ,(something)=>{ /*something to run on success*/  }] )
//       if a thing is known, move it to internal storage
//           invoke onrelocated
//
// e.store( something )
// e.store( somthing [,inthing] )
// e.drop( thing )
//   thing has to have been contained in e
//   if thing is attachd to other things,
//        if that thing is the immediate content in e, all objects get moved.
//        if that thing is only attached to the single point, that thing itself wil be detatched
//             and that thing willl be dropped, receiving both detached and reloated events
// returns thing

// e.rebase(a)
//       if a is something that's attached, set that as the 'contained' objects
//          if it's not already the contained object... emit event rebase( a)
//    returns e
// e.debase()
//     if there is something attached to it, mkae that the contained objects
//         if( moved contained ) event rebase( a)
//          if( moved contained ) event newroot(a) to container
//    returns e


"use strict";
const _debug_require = false;
const _debugPaths = _debug_require || false;
const _debug_threads = false;
const _debug_run = false;
const _debug_look = false;
const _debug_rebase = false;

const myPath = import.meta.url.split(/\/|\\/g);
const tmpPath = myPath.slice();
tmpPath.splice( 0, 3 );
tmpPath.splice( tmpPath.length-1, 1 );
const appRoot = (process.platform==="win32"?"":'/')+tmpPath.slice(0).join( '/' );


import process from "process";
import cp from "child_process";
import util from "util";
import {sack} from "sack.vfs"
import {Events} from "sack.vfs/Events2"
const vol = sack.Volume();
const JSOX = sack.JSOX;

//JSOX.registerToJSOX( "entity", Entity,

function EntityToJSOX (s){
	const r = this.toString(s);
	return r
}

//JSOX.fromJSOX( "entity", Entity, function(field,val){
function EntityFromJSOX(field,val ) {
	//console.log( "Revive entity info:", field, val )
	if( !field ) {
		if( this.Λ instanceof Promise ) {
			const this_ = this;
			console.log( "Still waiting for our identity to revive?")
			this.Λ.then( Λ=>{
				setObj( Λ.Λ, this_ );
			} )
		} else 
			setObj( this.Λ.toString(), this );

		function setObj( id,o ) {
			objects.set( id,o );
			// fixup contains and attach maps... but...
			const newContains = new Map();
			//console.log( "Reloading, restoring contents...", o.contains );
			o.contains.forEach(content=>{
				//console.log( "Copying content...", content );
				if( content instanceof Promise ) {
					//console.log( "Attaching to promised item");
					content.then( c=>{
							//console.log( "promised item is now resolved", c );
							newContains.set( c.Λ, c )
						} )
				}
				else
					newContains.set( content.Λ, content );
				
			})			
			o.contains = newContains;

			const newAttaches = new Map();
			o.attached_to.forEach(content=>{
				//console.log( "Copying attachment...", content );
				if( content instanceof Promise ) {
					//console.log( "Attaching to promised item");
					content.then( c=>{
						//console.log( "promised item is now resolved" );
						newAttaches.set( c.Λ, c )
						} )
				}
				else
					newAttaches.set( content.Λ, content );
			})			
			o.attached_to = newAttaches;
		}
		

		return this;
	}
	if( field === "created_by") {
		//console.log( "This is just bad... no cread?", this, field, val );
		if( !val )  console.log ( "LOST VAL", val, field );
		this.created.length = 0; // on revival, this will have been wrong (all objects get created like TheVoid)
		const this_ = this;
		if( val instanceof Promise ) 
			val.then( (val)=>val.created.push(this_));
		else
			val.created.push(this);
		//if( pval && pval.created )
		//	pval.created.push(this);
	}
	/*
	if( field === "contains" || field === "attached_to") {
		const this_ = this;
		val.forEach( content=>this_.contains.set(content.Λ,content));
		return this.contains;
	}
	*/
	return this[field] = val;
}


function EntityRefFromJSOX( field,val ) {
	if( field !== undefined ) {
		return this[field] = val;
	}
	console.log( "in this context what params?", field, val );
}

/*
JSOX.defineClass( "entity", { Λ:null
	, name: null
	, description: null
	, within: null
	, attached_to: null
	, created_by: null
	, sandbox : null
	, _module : null
	, state : null
} )
*/
// this is used to generate an http request to the real core(if there is one?)


import fc from "../file-storage/file_cluster.mjs"
import config from "../config/config.mjs";

config.start( ()=>{
	fc.addEncoders( [{tag:"~E",p:Entity,f:EntityToJSOX }] );
	fc.addDecoders( [{tag:"~E",p:Entity,f:EntityFromJSOX }] );
	fc.addDecoders( [{tag:"Er",p:null,f:EntityRefFromJSOX }] );
	
})
function doLog(...args){
	var s = util.format(...args);
	sack.log('Entity:'+s);
	console.log(s);
}

class entityInterface  {
	static create = makeEntity
	static theVoid = null
	static getObjects = exported_getObjects
	static getEntity = getEntity
	static addProtocol = null; // filled in when this returns
	static  config = config;
	static makeEntity = makeEntity;
	static idMan = null;//idMan
	static saveAll() {
		return console.trace( "Don't really want to Save ALL....");
		if( createdVoid ) {
			var saved = new Map();
			var output = [];
			var o = makeEntity( createdVoid.Λ );
			recurseSave( o );
	   
			//for( var n = 0; n < output.length; n++ )
			//		output[n] = output[n].toString();
			doLog( 'output  "core/entities.jsox"', output );
			fc.store( "core/entities.jsox", JSOX.stringify( output, null, 2 ) )
			function recurseSave( o ) {
				if( saved.get(o.Λ) ) return; // already saved.
				if( o.saved ) {
					output.push( o.toRep() );
				}
				saved.set( o.Λ.toString(), o );
				o.attached_to.forEach( recurseSave );
				//doLog( "Saving:", o.toString() )
				o.contains.forEach( recurseSave );
				o.created.forEach( recurseSave );
			}
		}
	}
};

export {entityInterface};
export default entityInterface;

var objects = new Map();
var remotes = new WeakMap();
var childPendingMessages = new Map();
const requireCache = new Map();

/*
JSOX.defineClass( "Entity", { name:null } );
JSOX.registerToJSOX( "Entity", Entity, (obj)=>{
		return '"THIS STRING REPRESENTS AN ENTITY"';
	} );
*/

function sandboxWS( url, protocols ) {
	let self = this;
	if( !(this instanceof sandboxWS) )
		return new sandboxWS( url, protocols );

	this.ws = new sack.WebSocket.Client( url, protocols );
	//doLog( "Key is:", this.keyt)

	this.close = function() { this.ws.close() };
	this.onopen = function(cb){ this.on( "open", cb ) }
	this.onmessage = function(cb){ this.on( "message", cb ) }
	this.onerror = function(cb){ this.on( "error", cb ) }
	this.onclose = function(cb){ this.on( "close", cb ) }
	this.on = function(event,cb) { this.ws.on( event, cb ); }
}

function sandboxWSS( opts ) {
	let self = this;
	if( !(this instanceof sandboxWSS) )
		return new sandboxWS( url, protocols );

	this.ws = new ws.Server( opts );

	this.on = function(event,cb) {
		if( event === 'connection' ) {
			this.ws.on( 'connection', function(ws) {
				
				//ws.close = function() { ws.close() };
				ws.onopen = function(cb){ ws.on( "open", cb ) }
				ws.onmessage = function(cb){ ws.on( "message", cb ) }
				ws.onerror = function(cb){ ws.on( "error", cb ) }
				ws.onclose = function(cb){ ws.on( "close", cb ) }
				ws.on = function(event,cb) { ws.on( event, cb ) }
				cb( ws );	
			} );
		}else {
			doLog( "unknown event specified:", event );
		}
	}
}




var drivers = [];

var nextID = null;

//Λ

//const sentience = require( "../Sentience/shell.js");

var createdVoid = false;
var theVoid = null; // private tracker, to validate someone didn't cheat the export
var base_require;


function sealEntity(o) {
	//doLog( "before sealing:", JSOX.stringify(o ) );
	[ //"container", 
		//"contents", 
		"attached_to", "created", "created_by", "owner", "save_"
	].forEach(key => {
		Object.defineProperty(o, key, { enumerable: true, writable: true, configurable: false });
	})

	/*
	for( var k in o ){
		if( typeof o[k] === "function")
			Object.defineProperty(o, k, { enumerable: false, writable: true, configurable: false });
	}
	*/
	if(0)
		[ "attach", "create"
		, "has_state", "loaded"
		, "assign", "detach", "rebase", "debase", "drop", "store", "fromString", "toString"
		, "EventEmitter", "usingDomains", "defaultMaxListeners", "init", "listenerCount", "requested"
		, "addListener", "removeListener", "removeAllListeners", "vol"
		//,"nearObjects"
		].forEach(key => {
			Object.defineProperty(o, key, { enumerable: false, writable: true, configurable: false });
		});
	["V","Λ", "JSOX", "sandbox"].forEach(key => {
		Object.defineProperty(o, key, { enumerable: false, writable: true, configurable: false });
	})
	Object.defineProperty(o, "io", { enumerable: false, writable: true, configurable: true });
}


function makeEntity(obj, name, description, callback, opts) {
	if (this instanceof makeEntity) throw new Error("Please do not call with new");
	if (!name && !description) {
		//var all = all_entities.get(obj);
		//console.trace( "Lookup:", objects, obj );
		var named = objects.get(obj.toString());
		//doLog( "Got",  named, obj )
		obj = named || obj;
		return named;
	}
	//console.trace( "Shouldn't be making entities until config.js finishes" );
	if (typeof (obj) === "string") {
		obj = objects.get(obj);
	}
	
	if (obj && !obj.Λ) {
		console.log( "Clearing obj...");
		base_require = require;
		obj = null;
	}
	if ((!obj || !(objects.get(obj.Λ.toString()))) && createdVoid) {
		//doLog("All Entities", all_entities);
		doLog("Objects", objects);
		doLog("invalid object is ", obj);
		throw new Error(["Invalid creator object making this one", obj].join(" "));
	}
	if (!config.run.Λ) {
		doLog( "had to wait for config.run", name, description )
		config.start(() => { makeEntity(obj, name, description, callback, opts) })
		return;
	}
	const o = new Entity( obj, name, description );
	//console.log( "calling a new Entity:", name, description );
	if( !entityInterface.theVoid ) {
		if( theVoid )
			throw new Error( "User corrupted entity interface" );
		theVoid = entityInterface.theVoid = o;
	}
	if( !o.Λ ){
		//console.log( "Setting the root of all objects.", config.run.Λ, theVoid === o, theVoid );
		if( theVoid === o ) 
		{
			o.Λ = config.run.Λ;
		}

		if( nextID ) {
				throw new Error( "NextID should NOT be being used?");
				o.Λ = nextID;
				nextID = null;
				finishCreate();
			}
			else {
				o.Λ = sack.id();
			}
	}

	finishCreate();

	function finishCreate( ) {
		//doLog( " ----- FINISH CREATE ---------" );
		if( opts && opts.fork ) {
			o.child = cpts.fork( "childEntity.js", [o.Λ] )
			o.child.on( "message", (msg)=>{
				if( msg.op === "present" ) {
					o.child.send( { op:"first message test"});
				}
			})
		} 
		//console.log( "Finish create and set in container:", o.Λ );
		if (o.within) o.within.contains.set(o.Λ.toString(), o );
		else {
			o.within = o;
            //console.log( "Set object:", o.Λ, o);
			//objects.set(createdVoid.Λ.toString(), o);
		}
		sealEntity(o);
		/*
		o.within.contains.forEach(near => {
			const nearo = objects.get(near);
			nearo&&	nearo.thread&&nearo.thread.emit("created", o.Λ.toString()) 
		});
		*/
		let oldId = o.Λ.toString();
		objects.set(oldId, o);
		
		if(0) // key doesn't change in realtime
		o.Λ.on(()=>{
			const newId = o.Λ.toString();
			objects.delete(oldId);
			objects.set(newId, o);

			o.within.contains.delete( oldId );
			o.within.contains.set( newId, o );
			for( let a of o.attached_to ) {
				a.attached_to.delete( oldId );
				a.attached_to.set( newId, o );
			}
			o.emit( "rekey", o.Λ );
			o.saved = o.saved; // save it if it is saved.
		})

		if( o.within ) {
			o.within.emit("created", o.Λ);
			o.within.emit("stored", o.Λ);
		}
		o.contains.forEach(near => (near !== o.Λ) ?
				near.emit("joined", o.Λ) 
			: 0 
		);

		if (!callback)
			throw new Error("No Callback specified to create entity?");
		else {
			//doLog(" ---------- Result with completed, related object ------------------ ");
			if( typeof( callback ) === "string" )  {
				// callback is a script, which moves arguments over one place...
				/*
				o.wake().then( (thread)=>{
					return thread.runFile( callback );
				} );
				opts(o);  // then opts is actually the callback if callback was a string to run.
				*/
			}
			else
				callback(o);
		}

	}

}


class Entity extends Events {
		Λ= null;
		V= null;
		within= null;
		attached_to= new Map();//[]
		; config = {
			hasSocket : false,
		}
		; contains= new Map()//[]
		; created_by= null
		; created= []
		; owner = null 
		; loaded= false
		; has_state= false
		; state= null
		; name= null
		; description= null
		; command= null
		; permissions= { allow_file_system: true }
		; sandbox= null // operating sandbox
		; child = null // child process
		; vol= null
		; #save = false // saved.
		; #watchers = new Map()
		; scripts = { code: [], index : 0, push(c){ this.index++; this.code.push(c)} }
		; sandbox = {} // enabled methods.
		; _module= {
			filename: "internal"
			, src: null
			, source : "this"
			, file: "memory://"
			, parent: null
			, paths: [ appRoot + "/.."]
			, exports: {}
			, loaded: true
			, rawData: ''
			, includes: []
		}

	constructor(obj,name,desc ) {
		super();
		this.within = obj;
		this.description = desc;
		this.name = name;
		this.created_by = obj || this;
		//console.log( "o.created_by:", o.created_by, obj, this )

		//Object.assign( this, o );
		this.created_by.created.push( this );

		if( !entityInterface.theVoid ) theVoid = entityInterface.theVoid = this;
	
		//return o;
	}


		get container() { /*doLog( "Getting container:",this); */return this.within; }
		 create(name, desc, cb, state) {
			//console.trace("Who calls create?  We need to return sandbox.entity?");
			if (typeof desc === 'function') {
				cb = desc; desc = null;
			}
			makeEntity(this, name, desc, (newo) => {
				//console.trace(" Newo maybe isn't an entity?", newo );
				if( state ) newo.state = state;
				if (typeof cb === 'string') {
					newo.sandbox.import(cb); // load and run script in entity sandbox
					cb = state;
				} 
				if (cb) cb(newo) // this is a callback that is in a vm already; but executes on this vm instead of the entities?
			});
			
		}
		 birth( ) {
			console.log( "REmotes must be a very strange lookup...");
			remotes.set( this, this );
			this.child = cp.fork( __dirname + "/childEntity.js", [this.Λ, config.run.defaults.defaultPort.toString()])
			this.child.on( 'message', (msg)=>{
				if( msg.op === "driver" ) {
					var driver = drivers.find( d=>d.name === msg.driver );
					runDriverMethod( this, driver, msg );
				}
			} )
			this.child.on( 'close', (code)=>{
				remotes.delete( this );
			});
		}
		 look() {
			var done = [];
			getObjects(this, null, true, (o,location) => {
				//doLog( "Got a object to look at?", o, o.entity.name );
				done.push({ name: o.entity.name, ref: o.me, o:o, loc:location });
			})
			//doLog( "result:", done );
			return done;
		}
		 getObjects(...args){ return getObjects(this, ...args) }
		 get contents() { 
			var refs = []; 
			this.contains.forEach( c=>refs.push(c.Λ.toString() ) );
			//console.log( "Returning refs:", refs );
			return refs; }
		 get near() {
			var result = [];
			for( let near of this.within.contains){
				if( near[1] !== this ){
					result.push( near[0] );
				}
			} 
			return result;
		}
		 get exits() {
			var result = [];
			var anchor = findContained( this );
			for( let near of anchor.parent.attached_to){
				result.push( near.Λ );
			} 
			return result;
		}
		 get room() {
			if( this.within ) return {parent:this.within.Λ,at:this.Λ,from:null};
			return this.container;
		}
		 get container() {
			var anchor = findContained( this );
			var from = anchor;
			while( from = from.from ) {
				from.parent = from.parent.Λ.toString();
				from.at = from.at.Λ.toString();
			}
			anchor.parent = anchor.parent.Λ.toString();
			anchor.at = anchor.at.Λ.toString();
			return anchor;
		}
		 get nearObjects() {
			var near = new Map();
			let c = new Map();
			//console.log( "Building nearObject List for:", this.name );
			this.attached_to.forEach( e=>c.set(e.Λ.toString(),e.Λ.toString()) );

			near.set("holding", c );
			c = new Map();
			this.contains.forEach( e=>{
				//console.log( "This actually has contained? (contains?)", e.name );
				if( "object" === typeof e )
					c.set(e.Λ.toString(),e.Λ.toString())
				else
					c.set(e,e)
			} );
			near.set("contains", c );
			near.set("near", (function (on) {
				var result = new Map();

				if (on.within) {
					on.within.contains.forEach((nearby,nearE) => {
						//doLog( "my room contains:", nearby, nearE );
						if (nearby !== on) {
							//let realNear = objects.get( nearby );
							result.set(nearE.toString(),nearE.toString() );
						}
					});
					on.within.attached_to.forEach((nearby,nearE) => {
						//doLog( "my room attached to:", nearby, nearE );
						result.set(nearE.toString(), nearE.toString() );
					});
					return result;
				}
			})(this));
			return near;
		}
		assign(object) {
			console.trace( "This maybe isn't an entity?", this, object );
			this.state = object;
			if (config.run.debug)
				sanityCheck(state);
		}
		attach(a) {
			if( "string" === typeof a ) a = objects.get(a);
			if( a === this )
				throw new Error( "Why would you attach a thing to itself?" );
			
			if( a.attached_to.get( this.Λ ) ) {
				throw new Error( "objects are already attached." );
				return;
			}
			if( a.within ) a.rebase();

			{
				a.attached_to.set(this.Λ.toString(), this);
				this.attached_to.set(a.Λ.toString(), a);

				this.emit('attached', a.Λ);
				a.emit('attached', this.Λ);
			}
		}
		detach(a) {
			if( "string" === typeof a ) a = objects.get(a);
			const aΛ = a.Λ.toString();
			const tΛ = this.Λ.toString();
			if( a.attached_to.get( tΛ ) )
				if( this.attached_to.get( aΛ )) {
					// one or the other of these is within.
					// both have to be attached to the third.
					a.attached_to.delete(tΛ);
					this.attached_to.delete(aΛ);
					this.emit('detached', aΛ);
					a.emit('detached', tΛ);				
					console.log( "Success detaching..." );
					return a;
				}
			//throw "objects are not attached: " + this.name + " & " + a.name;
			return null;
		}
		watch(a) {
			a = objects.get( a ) || a;
			//console.trace( this.name, " is watching:", a.name );
			if( a ) {
				a.#watchers.set(this.Λ.toString(), this);
			}else {
				console.log( "failed to find entity to watch?", a)
			}
		}
		ignore(a) {
			a = objects.get( a ) || a;
			a && a.#watchers && a.#watchers.delete(this.Λ);
		}
		insert(a) {
			if( a === null ) return;
			a.within = this;
			this.emit('stored', a.Λ );
			
			this.contains.forEach( peer=>{
				peer = objects.get(peer)||peer;
				if( peer != this ) {
					//console.log( "------- insert join notification to:", peer.name );
					//peer = objects.get( peer );
					peer.emit('joined', a.Λ );
				}
			});
			this.contains.set( a.Λ.toString(), a );
			a.emit('placed', this.Λ );
		}
		rebase() {
			// this removes an entity from space...
			// it is no longer within
			// it remains attached... so either
			// the
			//console.log( "Rebasing an object... (remove from room)", this.name, this.within.name, this.Λ )
			const room = this.within;
			if( room ){
				room.contains.delete(this.Λ.toString());
				//console.log( "removing content", room.name, room.contains );
				// tell room it lost something
				room.emit( "lost", this.Λ );
				// tell others in the room some parted the room.
				// headed to?
				room.contains.forEach( (content)=>{
					
					// tell all the contents that this has parted...
					
					// I wouldn't be in my own list near... 
					if( content === this ) {
						return;
					}
					_debug_rebase && doLog( "content:", content );
					
					content.emit( "parted", this.Λ );
				})
				this.within = null;
			}else {
				throw new Error( "Entity is not the anchor in the chain, please drop a proper object" );
				// doesn't matter, it's detached enough from contants.
			}
		}
		debase(a) {
			// debase changes which object in a set of objects is the one
			// that is within a container; all other attached objects are 
			// not immediately visible within.
			if (a.within) {
				if (a.attached_to.length) {
					a.attached_to.forEach((key, val) => {
						if (val.within) {
							a.within = null;
							throw "attempt to debase failed...";
						}
					})
					if (a.attached_to[0].within) {
						a.within = null;
						throw "attempt to debase failed...";
					}
					try {
						// just ned to get the first element...
						// so we throwup here (*puke*)
						a.attached_to.forEach((key, val) => {
							key.within = a.within;
							a.within.contains.set(key, val);
							a.within.contains.delete(a.Λ);
							throw 0;
						})
					} catch (err) { if (err) throw err; }
					a.within = null;
				}
				else {
					// already debased (that is, this isn't the thing within)
					return;
				}
			}
		}
		enable( method, args, code ) {
			var ability = { method:method, args:args, code:code };
			const this_ = this;
			// the code in this sandbox is not run here...
			this.sandbox[method] = ability;
			this.#watchers.forEach( watcher=>{
				// tell everyone watching this that there's a method...
				watcher.emit( "enable", [this_.Λ, ability] );
			} );
			// tell this thread about its own method...
			//if( this.thread ) this.thread.emit( "enable", [this.Λ.toString(), ability] );
		}
		disable( method ) {
			
		}
		leave(to) {
			if( !to ) to = this.within;
			to = objects.get( to );
			this.rebase(); // free from container
			outerRoom.insert( to ); // put in new container
		}
		escape() {
			var outer = this.within || findContained(this).parent;
			var outerRoom = outer.within || findContained(outer).parent;
			this.rebase(); // free from container
			outerRoom.insert( this ); // put in new container
		}
		enter( newRoom ){
			newRoom = objects.get( newRoom );
			this.rebase(); // free from container
			console.log( "rebased 'this'", this.name, newRoom.name );
			newRoom.insert( this );  // put in new container
		}
		grab(a) {
			//doLog( "THing:", this.name, "A:", a.name );
			var grabobj = ( "string" === typeof a && objects.get( a ) ) || objects.get( a.entity.Λ.toString() );
			if( grabobj ) {
				if( !grabobj.within ) {
					throw new Error( "Entity cannot be grabbed, it is not the anchor point.", grabobj.Λ.toString() );
				}
				grabobj.rebase(); // moves object to use me as a base...
				this.attach( grabobj );
			}
		}
		emit( event, data ) {
			const this_ = this;
			//console.log( "emitting an event:", this.name, event, data)
			//if( data instanceof idMan.keyRef )
			//	data = data.toString();
			// drop the promise result, there is no then or catch.

			//console.log( "this watchers:", this.watchers.size );
			this.#watchers.forEach( watcher=>{
				//console.log( 'Sending event', event, 'about', this_.name, "to", watcher.name, "id:", this_.Λ )
				// can't be a watcher without being a thread.
				//watcher.on( {op:"on",Λ:this_.Λ.toString(),on:event,args:data} )
				watcher.on( event, [data,this_.Λ.toString()] );
			})
	   }

		hold(a) {
			//doLog( "THing:", this, "A:", a );
			var grabobj = ( "string" === typeof a && objects.get( a ) ) || objects.get( a.entity.Λ.toString() );
			if( grabobj ) {
				this.attach( grabobj );
			}
		}
		drop(a) {
			var outer = this.within || (outer = findContained(this).parent );
			console.log( '---------------------------- REMOVE CONTENT');
			var grabobj = ( "string" === typeof a && objects.get( a ) ) || objects.get( a.entity.Λ.toString() );
			//doLog( "Core:Drop Command", grabobj, this.detach );
			if( this.detach( grabobj ) ) {
				//doLog( "Detached, can insert", grabobj )
				if( !findContainer( grabobj, null )){
					//doLog( "Is not contained...");
					outer.insert( grabobj );
				}else {
					// this is okay too... just letting go of a rope, but
					// then it retracts to its source room immediately.
					// there is no 'parted' event generated
					// nor is it lost to the room... 
					//doLog( "Found that there was a ccontainer" );
				}
			}else {
				// this is really OK tooo... 
				// it is probably somehting resently assembled/attached in hand.
				console.log( "Object is still attached to you, somehow." );
			}
		}
		owns(a) {
			return isOwned( this, a );
		}
		store(a) {
			const grabobj = ( ( "string" === typeof a ) && objects.get( a ) ) || a || (this === entityInterface.theVoid, entityInterface.theVoid);
			console.log( "storing a in this", grabobj, a, this.name );
			//if( this.owns( grabobj ) ) 
			this.insert( this.detach( grabobj ) );
			//else 
			//	throw new Error( "Not allowed to store items you don't own.");
			console.log( "stored?" );
		}

		addProtocol(p, cb) {
			entityInterface.addProtocol(this.Λ + p, cb);
		}
		delete() {
			for( var c in this.created ) c.delete();
			if( this.within )
				this.within.contains.delete( this.Λ );
			this.attached_to.foEach( a=>{
				a.attached_to.delete( this.Λ );
			})
			this.contains.forEach( c=>{
				this.within.store( c );
			} )
			a.#watchers.forEach( e=>e.emit( "delete", a.Λ ) );
			this.contains = null;
			this.attached_to = null;
			this.within = null;
			objects.delete( this.Λ );
			//entity.idMan.delete( this.Λ, config.run.Λ );
		}
		postRequire( src  ){
			//var o = objects.get( Λ );
			doLog( "Requiring for something:", src )
			return  sandboxRequire( this, src );
		}
/*
		wake( socket ) {
			if( !this.thread ) {
				if( socket ) {
					
				   const newsock = sack.WebSocket.Thread.accept(this.Λ.toString(),async (id,ws)=>{ 
						// should validate the the ID is the expected ID.
			        	ws.resume();
						const promise= wake.WakeEntity( this, true, ws ).then( (arg)=>{
							return arg;
						} );
						return promise;
					} )
					if( newsock ) 
						newsock.then( (x)=>{ 
			        		ws.resume();
							return x;
						} );
					return newsock;
				} else
					return wake.WakeEntity( this, false, null );
			} 
			return Promise.resolve(this.thread);
		}
*/
		idGen() {
			var this_ = this;
			return new Promise( (res)=>{
				doLog( "o:", o.name, o.Λ)
				res( sack.id() );

				if( 0 )
				entityInterface.idMan.ID(this_.Λ, this_.created_by.Λ, (id)=>{
					res(id);
				});
			})
		}
		toString(strngfr) {
			var attached = null;
			//var strngfr = sack.JSOX.stringifierActive;
			if( this.attached_to ) {
				this.attached_to.forEach((member) => { 
					let newVal;
					if( "string" === typeof member ) member = objects.get(member);
					if( strngfr ) {
						let status = member.V;
						if(status)
							newVal =  '~or"'+status+'"';
						else {
							newVal = strngfr.encodeObject( member );
							if( newVal === member ) {
								if( member === this )
									newVal = strngfr.stringify( member )
								else
									newVal =  null;
							}
						}
					} else
						newVal = '"'+member.Λ.toString()+'"';
					if( newVal ) {
						if (attached) attached += ','; 
						else attached = ' ['; 
						attached += newVal
					}
				 })
				if (attached) attached += ']';
				else attached = '[]';
			} else attached = "don't stringify me";

			var contained = null;
			if( this.contains ){
				//this.contains.forEach((member) => { if (contained) contained += ','; else contained = ' ['; contained += strngfr?strngfr.stringify( member ):'"'+member.Λ.toString()+'"' })
				this.contains.forEach((member) => { 
					let newVal;// = strngfr?((member.saved||member===this)?strngfr.stringify( member ):''): ('"'+member.Λ.toString()+'"' );
					if( "string" === typeof member ) member = objects.get(member);
					if( strngfr ) {
						//console.trace( "Has stringifier this pass", this.saving, member.saving );
						let status = member.V;
						if(status && member !== this )
							newVal =  '~or"'+status+'"';
						else {
							newVal = strngfr.encodeObject( member );
							if( newVal === member ) {
								if( member === this ) // encode object reference.
									newVal = strngfr.stringify( member )
								else
									newVal =  null;
							}
						}
					} else {
						console.log( "No stringifier this pass");
						newVal = '"'+member.Λ.toString()+'"';
					}
					if( newVal ) {
						if (contained) contained += ','; 
						else contained = ' ['; 
						contained += newVal
					}
				 })
				if (contained) contained += ']';
				else contained = '[]';
				//sack.log( util.format( "Saving:", this)) ;
			}

			var wthn = null;
			if( strngfr ){
				const tmp = strngfr.encodeObject(this.within);
				if( tmp !== this.within )
					wthn = tmp;
				else
					wthn = strngfr.stringify( this.within );
			}
			if( !wthn  ) {
				wthn = this.within.V?('~or"'+this.within.V+'"'):('Er[i"'+this.within.Λ+'"]');
			}
			var crtd = null;
			if( strngfr ){
				const tmp = strngfr.encodeObject(this.created_by);
				if( tmp !== this.created_by ) crtd = tmp;
				else crtd = strngfr.stringify( this.created_by );
			}
			if( !crtd  ) {
				crtd = this.created_by.V?('~or"'+this.created_by.V+'"'):('Er[i"'+this.created_by.Λ+'"]');
			}
			const mods = (strngfr?strngfr.stringify(this._module,null,null,"_module"):JSOX.stringify( this._module ));
			//console.log( "encoded mods with stringifier? or just raw?", !!strngfr, mods );
			return '{Λ:i"' + this.Λ.toString()
				+ '",V:"' + this.V
				+ '",state:' + (this.state && this.state.toString())
				+ ',name:"' + (this.name)
				+ '",description:"' + (this.description)
				+ '",within:' + wthn
				+ ',attached_to:' + attached
				+ ',contains:' + contained
				+ ',created_by:' + crtd
				//+ ',"code":' + JSOX.stringify( this.sandbox.scripts.code )
				+ ',_module:'+ mods
				+ '}\n';
			
		}
		toRep() {
			var attached = [];
			this.attached_to.forEach((member) =>attached.push( member.Λ ) )
			var rep = { Λ:this.Λ
				, name: (this.name)
				, description: (this.description)
				, within: (this.within && this.within.Λ)
				, attached_to: attached
				, created_by: this.created_by.Λ
				, sandbox : this.sandbox
				, _module : this._module
				, state : this.state4
			};
			return rep;
		}
		#saved = false;
		resume() {
			console.log( "Want me to resume? What do I have?", this );
		}
		save() {
			this.saved = true;
			return this.saved;
		}
		get saved() {
			return this.#saved;
		}
		set saved( val ) {
			if( val ) {
				if( this.V ) {
					return fc.put(this );
				}
				const this_ = this;
				this_.saving = true;
					if( true ) {
						

						this.#saved = fc.put( this ).then( (id )=>{
							if( this.created_by !== this )
								this.created_by.save();
							//console.log( " storage identifier:", this.name, id );
							this_.V = id;
							//console.log(" Resolving with new id");

							// all other things which have this as a reference, and have been saved need to update.
							// if the container is not a saved thing, must also save that thing.
							if( this_.within !== this_ )
								this_.within.saved=val;
							this.saving = false;
							//this.#saved = '~os"'+id+'"';
							
							return id;
						} );

					} else 

				this.#saved = new Promise( (res,rej)=>{
					//console.log( "SAVED KEYREF?", x, this );
					this.Λ.save().then( (id) =>{
						if( !id ) console.log( "Save somehow failed... (it won't)");
						this.#saved = fc.put( this ).then( (id )=>{
							if( this.created_by !== this )
								this.created_by.save();
							//console.log( " storage identifier:", this.name, id );
							this_.V = id;
							//console.log(" Resolving with new id");
							res( id );

							// all other things which have this as a reference, and have been saved need to update.
							// if the container is not a saved thing, must also save that thing.
							if( this_.within !== this_ )
								this_.within.saved=val;
							this.saving = false;
							//this.#saved = '~os"'+id+'"';
							return id;
						} );
						/* do we require any other things to be saved because this is saved? */
					});
				})
			}
		}
		static fromString(s) {
			s = JSOX.parse(s);
			if( s.parent === s.Λ )
				s.parent = null;
			const entity = createEntity( s.parent, s.name, s.description )
		
			o.Λ = s.Λ;
				console.warn( "create sandbox here, after getting ID --------- FROM STRING?!")
		
				if (o.within) {
					console.log( "From String  create and set in container:", o.Λ );
		
					o.within.contains.set(o.Λ.toString(), o);
				} else
					o.within = o;
		
				var oldId = o.Λ.toString();
				o.Λ.on(()=>{
					o.within.contains.delete( oldId );
					o.within.contains.set( o.Λ.toString(), o );
					for( let a of o.attached_to ) {
						a.attached_to.delete( oldId );
						a.attached_to.set( o.Λ.toString(), o );
					}
					objects.delete( oldId );
					objects.set(o.Λ.toString(), o);
					o.emit( "rekey", o.Λ );
				})
				objects.set(o.Λ.toString(), o);
		
				sealEntity(o);
		
				if (!o.within) {
					//o.attached_to.set(o.Λ.toString(), o);
				}else {
					o.within.emit("created", o.Λ);
					o.within.emit("inserted", o.Λ);
				}
				//o.within.contains.forEach(	=> (near !== o) ? near.thread.emit("joined", o) : 0);
		
				if (!callback)
					throw ("How are you going to get your object?");
				else {
					doLog(" ---------- Result with completed, related object ------------------ ");
				}
		}
		
		
	}

		


// this 
	function getObjects(me, src, all, callback) {
		// src is a text object
		// this searches for objects around 'me' 
		// given the search criteria.  'all' 
		// includes everything regardless of text.
		// callback is invoked with value,key for each
		// near object.
		var object = src && src[0];
		if( !src ) all = true;
		var name = object && object.text;
		var count = 0;
		//var all = false;
		var run = true;
		var tmp;
		var in_state = false;
		var on_state = false;

		//console.trace( "args", me, "src",src, "all",all, "callback:",callback )
		if (typeof all === 'function') {
			callback = all;
			all = false;
		}

		if (object && name == 'all' && object.next && object.next.text == '.') {
			all = true;
			object = object.next.next;
		}
		if (object && (tmp = Number(name)) && object.next && object.next.text == '.') {
			object = object.next.next;
            		name = object.text;
			count = tmp;
		}

		if( src&& src.length > 1  && src[1].text === "in" ) {
			console.warn( "checking 'in'");
			in_state = true;
			src = src.slice(2);
			getObjects( me, src, all, (o,location,moreargs)=>{
				o = objects.get( o.me );
				doLog( "THIS FUNCTION IS REMOVED TO LOCAL THREADSin Found:", o.name, name );
				o.contents.forEach( content=>{
					//if (value === me) return;
					if (!object || content.name === name ) {
						doLog( "found object", content.name )
						if (count) {
							count--;
							return;
						}
						if (run) {
							doLog("and so key is ", location, content.name )
							callback(content.sandbox, location+",contains", src.splice(1) );
							run = all;
						}
					}
				})
			})
			return;
		}
		if( src&&src.length > 1  && (src[1].text == "on" || src[1].text == "from" || src[1].text == "of" ) ) {
			on_state = true;
			doLog( "recursing to get on's...")
			src = src.slice(2);
			getObjects( me, object, all, (o,location,moreargs)=>{
				o = objects.get( o.me );
				doLog( "Found:", o.name, location );
				o.attached_to.forEach( content=>{
					//if (value === me) return;
					if (!object || content.name === name ) {
						doLog( "found object", content.name )
						if (count) {
							count--;
							return;
						}
						if (run) {
							doLog("and so key is ", key, content.name )
							callback(content.sandbox, location+",holding", src.splice(1) );
							run = all;
						}
					}
				})
			})
			return;
		}

		//var command = src.break();
		//doLog( "get objects for ", me.name, me.nearObjects )
		var checkList;

		if( !("forEach" in me) )
			checkList = me.nearObjects;
		else
			checkList = me;

		checkList.forEach(function (value, location) {
			// holding, contains, near
			//doLog("checking key:", run, location, value)
			if( !value ) return;
			if (run) value.forEach(function (value, member) {

				//doLog( "value in value:", value.name, name );
				if (value === me) return;
				if (!object || value.name === name ) {
					//doLog( "found object", value.name )
					if (count) {
						count--;
						return;
					}
					if (run) {
						//doLog("and so key is ", key, value.name )
						callback(value.sandbox, location, src &&src.splice(1) );
						run = all;
					}
				}
			});
		})
	}


function findContained(obj, checked) {
	try {
	if (obj.within) return { parent: obj.within, at: obj, from:null };
	if (!checked)
		checked = {[obj.Λ]:true};
	var result;
	var attached = obj.attached_to[Symbol.iterator]()
	for( let content of attached ) {
		content = content[1];
		if (checked[content.Λ]) continue;
		_debug_look && doLog(  "check for within:", content.name);
		if (content.within) return { parent:content.within, at:content, from:null };
		var result = findContained(content, checked);
		checked[content.Λ] = true;
		if (result) return { parent:result.parent, at:content, from:result };
	}
	
} catch(err) {
	doLog( "Failed:", err);
}
	throw new Error("Detached Entity");
}

function findContainer(obj, checked) {
	if (obj.within) return obj.within;
	if (!checked)
		checked = [];
	var attached = obj.attached_to[Symbol.iterator]()
	for (let content of attached) {
		content = content[1];
		if (checked[content.Λ]) continue;
		checked[content.Λ] = true;
		if (content.within) return content.within;
		var result = findContainer(content, checked);
		if (result) return result;
	}
	return null;//throw new Error("Detached Entity");
}

function isOwned( owner, obj, checked) {
	if (obj.within) return false;
	
	if (!checked)
		checked = {};
	var attached = obj.attached_to[Symbol.iterator]()
	for (let content of attached) {
		content = content[1];
		if( content === owner ) continue; // this object's container doesn't matter.
		if (checked[content.Λ]) continue; // already checked.
		checked[content.Λ] = true;
		if (content.within) return false;
		var result = isOwned( obj, content, checked);
		if (result) return result;
	}
	// nothing else attached to the object has a container point.
	return true;
}

function isContainer(obj, checked, c) {
	// this returns whether 'obj' is in 'c'.
	// Returns true is obj is attached to another
	// object which is within c.

	if (obj.within) return (obj.within.Λ === c.Λ);
	if (!checked)
		checked = {};
	else
		if( "result" in checked )
			return true;
	return recurseAttachments(obj, checked, c);

	function recurseAttachments(obj, checked, c) {
		var attached = obj.attached_to[Symbol.iterator]()
		for (let content in attached) {
			content = content[1];
			if (checked[content.Λ]) continue;
			checked[content.Λ] = true;
			if (content.within && content.within.Λ == c.Λ) {
				checked.result = content;
				return true;
			} 
			return recurseAttachments(content, checked, c);
		} 
		return false;
	}
}

function isAttached(obj, checked, c) {
	// returns true if this object is attached to some other object.
	doLog( "CHecked:", checked );
	if (!checked)
		checked = {};
	else
		for (let att of checked) {
			if( att === c )
				return true;
		}
	return recurseAttachments(obj, checked, c);

	function recurseAttachments(obj, checked, c) {
		for (let content of obj.attached_to) {
			if (checked[content.Λ]) continue;
			checked[content.Λ] = true;
			if (content.Λ === c.Λ) return true;
			return recurseAttachments(content, checked, c);
		} 
		return false;
	}
}


function getAttachments(obj, checked) {
	if (obj.within) return obj.within;
	for (content in obj.attached_to) {
		if (checked[content.Λ])
			break;
		checked[content.Λ] = content;
		getAttachments(content, checked);
	}
	return checked;
	throw "Detached Object";
}

function exported_getObjects(o, filter, all, callback) {
	//doLog( "getting objects from:", o.name );
	if (typeof all === 'function') {
		callback = all;
		all = null;
	}
	if( "string" === typeof o )
		o = objects.get(o);
	//doLog( "uhmm did we erase o?", o )
	if (o)
		o.getObjects(filter, all, callback)
}

function getEntity(ref) {
	var o = objects.get(ref);
	if (o) return o;
	return null;

}

function sanityCheck(object) {
	var s = JSOX.stringify(object);
	var t = object.toString();
	doLog(`jsox is ${s}`);
	doLog(`toString is ${t}`)
	var os = JSOX.parse(s);
	if (os !== object) {
		doLog(`did not compare for json conversion.  ${os}  ${object}`);
		doLog(os);
		doLog(object);
	}
}


function saveConfig(o, callback) {
	console.trace( "********SaveConfig Volume (FIXME)" );
	return;
	if (!("vol" in o))
		o.vol = sack.Volume(null, config.run.defaults.dataRoot + "/" + o.Λ);
	if( o.sandbox )		
		o.vol.write(JSOX.stringify(o.sandbox.config));
}

//res.sendfile(localPath);
//res.redirect(externalURL);
//
async function loadConfig(o) {

	if( !o.sandbox ) return;
	console.trace( "********LoadConfig Volume (FIXME)" );
	return;


	if (!("vol" in o))
		o.vol = sack.Volume(null, config.run.defaults.dataRoot + "/" + o.Λ);
	{
		var data = o.vol.read("config.json");
		if (data) {
			//doLog( "attempt to re-set entity...", result);
			var object = JSOX.parse(data.toString());
			Object.assign(o.sandbox.config, object);
			//doLog( "config reload is", config.run.Λ )
			//config.run = object;
			resume();
		}
		else {
			doLog("initializing config.")
			o.sandbox.config.defaults = await import("./config.json");
			saveConfig(o, resume);
		}
	}
}

