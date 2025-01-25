"use strict"

let stream;
if( "undefined" === typeof Λ ) {
	stream = require('stream')
}

if( "undefined" !== typeof Λ ) {

		stream = await require('stream')
}


class Filter extends stream.Transform {
	constructor() {
		super()
	}

        connectInput(stream) {
            	stream.pipe( this );
        }

        connectOutput(stream) {
            	this.pipe( stream );
        }
        disconnectInput(stream) {
                stream.unpipe( this );
        }
        disconnectOutput(stream) {
                this.unpipe( stream );
        }

}

exports.Filter = Filter;
