
if( "undefined" !== typeof Λ ) {
var util = await require('util')
var filter_base = (await require( "./filter_base.js")).Filter
} else {
var util =  require('util')
var filter_base = ( require( "./filter_base.js")).Filter
}
class  trim_newline extends filter_base {
	constructor(options) {
		super()
	    options = options || {};
	    options.decodeStrings = false;
	}
	_transform(chunk, encoding, callback) {
		// chunk is given as 'buffer' and is a buffer
		var string = chunk.toString();
		//console.log( "newline:", string );
	        
		if( ( string.lastIndexOf( "\r\n" ) === string.length-2 )||( string.lastIndexOf( "\n" ) === string.length-1 ) ) {
                	var newstr = string.replace( /\n|\r\n/, "" )
			//console.log( "stripped return" );
			this.push( newstr );
			//console.log( `transform called with ${newstr}...` );
		}
		else {
			this.push( chunk );
		}
		callback()
	}

}




exports.Filter = function(options) { return new trim_newline(options) };
