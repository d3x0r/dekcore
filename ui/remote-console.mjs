
const Λ = { 
	toString() { 
			return localStorage.getItem( "Λ" ); 
	} 
};

import "../../Sentience/sandboxInit2.mjs"
import {prerun} from "../../Sentience/sandboxPrerun2.mjs"

import {Filter as shell} from "./shell/shell.mjs"

//import {popups} from "@d3x0r/popups";
import {popups} from "../../node_modules/@d3x0r/popups/popups.mjs";

import {JSOX} from "./jsox.mjs";

import {editor} from "./editor.mjs";

const l = {
	ws : null, 
	commandHistory : null,
	commandIndex : 0,
};


var history = localStorage.getItem( "Command History" );
l.commandHistory = history &&JSOX.parse( history ) || [];

function openSocket() {

	const proto = location.protocol === "https:"?"wss:":"ws:";
	var ws = new WebSocket(proto + "//"+location.host+"/", "EntityRemote");
	
	ws.onopen = function() {
		// Web Socket is connected. You can send data by send() method.
		//ws.send("message to send"); 
		l.ws = ws;
		//ws.send( "{op:initDone}");
		//ws.send( '{ op: "write", data:"/help" }' );
	};
	ws.onerror = function (a,b) { 
		console.log( "was there a sensible error?", a, b );
	}
	ws.onmessage = function (evt) { 
		const msg_ = JSOX.parse( evt.data );
		if( !ws.processMessage || !ws.processMessage( msg_ ) )
			processMessage( ws, msg_ );
	};
	ws.onclose = function() { 
		l.ws = null;

		// remove the terminal scrollback.
		while( remoteConsole.output.childNodes[0] != remoteConsole.input )
			remoteConsole.output.childNodes[0].remove();
		remoteConsole.inputPrompt = remoteConsole.input;

		setTimeout( openSocket, 5000 ); // 5 second delay.
		// websocket is closed. 
	};
}

openSocket();

function processMessage( ws, msg ) {
	if( msg.op === "start" ) {
		prerun( msg.Λ, ws );
	}
	if( msg.op === "write" ) {
		remoteConsole.write( msg.data, msg.prompt );
	}

	// this needs to be sanbox prerun thiing.
	
}

function createConsole() {
	
	var popup = popups.create( "Entity Interface Terminal" );

	var vcon = {
		root:null,
		output:null,
		input:null,
		write(buf, prompt){
			var newspan = document.createElement( "span" );
			newspan.className = "outputSpan";
			newspan.textContent = buf;
				
			this.output.insertBefore( newspan, this.inputPrompt );
			if( prompt ) 
				this.inputPrompt = newspan;

			this.output.scrollTop = this.output.scrollHeight;

			//var newspanbr = document.createElement( "br" );
			//this.output.insertBefore( newspanbr, this.input );
		},
	};
	var root = popup.divContent;//document.body;
	var firstKey = true;

	vcon.output = document.createElement( "div" );
	vcon.output.className = "consoleOutputContent";
	root.appendChild( vcon.output);

	vcon.input = document.createElement( "SPAN" );
	vcon.input.setAttribute( "contentEditable", true );
	vcon.input.className = "consoleinputContent";
	vcon.output.appendChild( vcon.input );
	vcon.inputPrompt = vcon.input;
	
	vcon.input.placeHolder = "<input text here>";

	vcon.output.addEventListener( "click", ()=>setCaretToEnd( vcon.input));

function setCaretToEnd(target/*: HTMLDivElement*/) {
	const range = document.createRange();
	const sel = window.getSelection();
	range.selectNodeContents(target);
	range.collapse(false);
	sel.removeAllRanges();
	sel.addRange(range);
	target.focus();
	range.detach(); // optimization

	// set scroll to the end if multiline
	target.scrollTop = target.scrollHeight; 
}

	vcon.input.addEventListener( "keydown", (evt)=>{
		//console.log( evt );
		if( evt.key === 'Enter'	) {
			if( evt.shiftKey ) {
				//&& ( evt.ctrlKey || evt.altKey )

			}
			evt.preventDefault();			
			sendCommand();
			return;
		} else if( evt.key === "ArrowUp" ) {
			if( firstKey ) l.commandIndex = 0;
			if( l.commandIndex < (l.commandHistory.length-1) ) {
				evt.preventDefault();			
				l.commandIndex++;
				vcon.input.textContent = l.commandHistory[l.commandHistory.length-l.commandIndex].command;

				evt.preventDefault();			
								setCaretToEnd( vcon.input );
				
			}
		} else if( evt.key === "ArrowDown" ) {
			if( l.commandIndex > 0 ) {
				if( !firstKey )
					l.commandIndex--;
				if( l.commandIndex )
					vcon.input.textContent = l.commandHistory[l.commandHistory.length-l.commandIndex].command;
				else
					vcon.input.textContent = "";
				
				evt.preventDefault();			
								setCaretToEnd( vcon.input );
			}
		}
		firstKey = false;


	} );


	var inputSend = document.createElement( "INPUT" );
	inputSend.setAttribute( "type", "button" );
	inputSend.className = "consoleinputSender";
	inputSend.value = "Send Command";
	inputSend.addEventListener( "click", (evt)=>{
		evt.preventDefault();
		sendCommand();		
	} );

	vcon.output.appendChild( inputSend );

	vcon.input.focus();
	popup.show();
	return vcon;


	function sendCommand() {
		var cmd = vcon.input.textContent;
			//var newspanbr = document.createElement( "br" );
			//vcon.output.insertBefore( newspanbr, vcon.input );
		l.commandHistory.push( { command:cmd } );
		firstKey = true;
		if( l.commandHistory.length > 128 ) // if there's a lot of commands
			l.commandHistory.splice( 32, 0 );  // throw away a bunch of history..
			
		localStorage.setItem( "Command History", JSOX.stringify( l.commandHistory ) );
		vcon.inputPrompt = vcon.input; // update until a new prompt
		remoteConsole.write( "\n", false );
		l.ws.send( JSOX.stringify( { op:"write", data:cmd } ) );
		vcon.input.textContent = '';
		vcon.input.focus();
	}
}

const remoteConsole = createConsole();

remoteConsole.write( "Welcome to the virtual object playground...\n" );

