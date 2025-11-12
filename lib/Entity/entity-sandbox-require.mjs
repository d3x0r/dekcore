
	function runModule( o, thisModule ) {
		( _debug_threads || _debug_run ) &&  doLog( o.name, "POSTED CODE TO RUN TO THE OTHER THREAD... AND WE WAIT (pushed to stack)", thisModule.src );
		o._module = thisModule;
		return o.thread.run( {src:thisModule.src,path:thisModule.paths[0]}, thisModule.code ).then( (v)=>{
			// when this happens, I don't care about the result... 
			// I shouldn't have to pop 'module' because it's all async.
			// and I don't know if this is running, or another thing is running...

			_debug_run && console.log( "Run resulted... this is in the core; this should translate the result RuNID... (and pop stack)", v);
			o._module = thisModule.parent;
			return v;
		}).catch( e=>{
			o._module = thisModule.parent;
			//doLog( "Catch error of course?", e );
		} );
	}


	function sandboxRequire(o,src,parentPath) {
		console.log( "Sandbox require?", o.name, src, parentPath );
		if( !o || !src )
			console.trace( "FIX THIS CALLER this is", o, src );

		//var o = this ; //makeEntity( this.me );
		_debug_require && console.trace("sandboxRequire ",  src, parentPath );

		// resolves path according to relative path of parent modules and resolves ".." and "." parts
		//_debugPaths && doLog( o.name, JSOX.stringify( o._module,null, "\t"   ));

		const thisModule_ = 
				requireCache.get( parentPath );
		_debug_require && console.log( "This Module is current:", src, thisModule?thisModule_.filename :"-" );
		if( thisModule_ ){
			var include = thisModule_.includes.find( i=>{
					if( i.src === src ) return true;
					//if( i.filename === ( thisModule_.paths[0] +'/'+ src ) ) return true;
					return false;
			}
		 );
			if( include ) {
				include.parent = thisModule_;  // not sure why this isn't reviving.
				//console.log( "SEtting cache:", include );
				requireCache.set( include.filename, include );
				return runModule( o, include );
			}
		}
		parentPath = parentPath && thisModule_ && thisModule_.paths[0];
		_debugPaths && console.log( "ParentPath:", parentPath )

		var root = (parentPath?parentPath+'/':'')+src;//netRequire.resolvePath(src, o._module);
		_debugPaths && console.log( "ParentPath root...:", root )

		try {
			console.log( "Trying to read root?", root, vol );
			const bin = vol.read( root );
			if( bin ) var file = bin.toString();
			//console.log( "FILE TO LOAD:", root,'=',file );
			//fs.readFileSync(root, { encoding: 'utf8' });
		} catch (err) {
			doLog("File failed... is it a HTTP request?", err);
			return undefined;
		}
			
		//		console.log( "netRequire was used here to separate this path:", root );
		function stripFile( file ) {
			var i = file.lastIndexOf( "/" );
			var j = file.lastIndexOf( "\\" );
			i = ((i>j)?i:j);
			if( i >= 0 )
				return file.substr( 0, i );
			return "";
		}
		function stripPath( file ) {
			//console.warn( "File input is : ", file );
			var i = file.lastIndexOf( "/" );
			var j = file.lastIndexOf( "\\" );
			return file.substr( ((i>j)?i:j)+1 );
		}

		const strippedFile = stripPath(root);
		const strippedRoot = stripFile(root);

		_debugPaths && doLog("root could be", root, strippedFile, strippedRoot );

		var reloaded = o._module.includes.find( (module)=>{
			if( module.src === src || module.file === strippedFile )
				return true;
			return false;
				
		} );
		if( reloaded ) {
			console.log( "Entity already had the code for this module... running immediate" );
			return runModule( o, reloaded );
		}

		if( o.scripts.index < o.scripts.code.length ) {
			// using an existing script?
			var cache = o.scripts.code[o.scripts.index];
			//doLog( "cache is?", typeof cache, cache);
			if( cache.source === src ) {
				o.scripts.index++;
				console.log( "Require is currently in context:", o._module.src )
				var oldModule = o._module;
				var root = cache.closure.root;
				if( !cache.closure.paths ){
					doLog( "About to log error?" );
					doLog( "Undefined paths:", cache.closure.paths, __dirname , ".");
					cache.closure.paths = [process.cwd()];
				}
				var thisModule = {
					filename: cache.closure.filename
					, src : cache.closure.src
					, source : "/*debughidden*/"//cache.closure.source
					, file: ""
					, parent: o._module
					, paths: cache.closure.paths
					, exports: {}
					, includes : []
					, loaded: false
				}
				//doLog( "NEW MODULE HERE CHECK PATHS:", cache.closure.paths, cache.closure.filename )

				oldModule.includes.push( thisModule );
				//        { name : src.substr( pathSplit+1 ), parent : o.module, paths:[], exports:{} };
				//oldModule.children.push( thisModule );
				doLog( "THIS IS ANOHER RUN THAT SETS o_MODULE");
				
				var root = cache.closure.filename;
				try {
					const filedata = vol.read( root );
					//doLog( "closure recover:", root, cache.closure )
				console.log( "got data?", filedata );
					var file = filedata?filedata.toString():"";

				} catch (err) {
					doLog( "src:", src );
					doLog("File failed... is it a HTTP request?", src, root, err);
					return undefined;
				}
				if( file !== cache.closure.source ) {
					doLog( "updating cached file....(save all? doesn't save all? just save this maybe?)", src )
					cache.closure.source = file;
					this.save = this.save; // save if saved?
					entity.saveAll();
				}
				var code = ['(async function(exports,module,resume){'
					, cache.closure.source
					, '})(_module.exports, _module, true );\n//# sourceURL='
					, root
				].join("");

				//doLog( "Executing with resume TRUE")
				doLog( "Run this script..." );
				return runModule( o, thisModule );
			}
		}


		const filePath = stripFile(root);
		//doLog( "This will be an async function...posted to run..." );
		var code =
			['(async function() { var module={ path:'+ JSON.stringify(filePath) +',src:'+ JSON.stringify(src) 
				+',parent:'+ JSON.stringify(root)  +',exports:{}, import(what){return sandbox.global.require(what,module.parent); }}; module.import.resolve=function(what){return sandbox.fillSandbox.import.resolve(what)};'
				, 'await (async function(global,exports,module,resume,import){'
				, file
				, '}).call(this,this,module.exports,module,false,module.import );'
				//, 'console.log( "Returning exports(not undefined:)", module.exports );'
				, 'return module.exports;})().catch(err=>{doLog( "caught import error:", err)})\n//# sourceURL='
				, root
			].join("");

		var oldModule = o._module;
		var thisModule = {
			filename: root
			, src : src
			, code : code
			, source : "/*DebugHiddenSource"//file
			, file: strippedFile
			, parent: o._module
			, paths: [strippedRoot]
			, exports: {}
			, includes : []
			, loaded: false
			, toJSON() {
				doLog( "Saving this...", this );
				return JSOX.stringify( { filename:this.filename, file:this.file, paths:this.paths, src:this.src, source:this.source })
			}
			, toString() {
				return JSOX.stringify( {filename:this.filename, src:this.src })
			}
		}
		oldModule.includes.push( thisModule );

		requireCache.set( thisModule.filename, thisModule );
		return runModule( o, thisModule );

	}

function sandboxRequireResolve(path){
	var o = makeEntity( this.me );
	if( !o || !this ) {
		//doLog( "Not in a sandbox, relative to object, so ...", module.path  );
		var tmp = module.path + "/" + path;
		tmp = tmp.replace( /[/\\]\.[/\\]/g , '/' );
		tmp = tmp.replace( /([^.]\.|\.[^.]|[^.][^.])[^/\\]*[/\\]\.\.[/\\]/g , '' );
		tmp = tmp.replace( /([^.]\.|\.[^.]|[^.][^.])[^/\\]*[/\\]\.\.$/g , '' );
		doLog( "final otuput:", tmp );
		return tmp;
	}
	doLog( "RESOLVE IS TRYING:", path , o._module.paths, o.name );

	var usePath = o._module.paths?o._module.paths[0]+"/":"";
	var tmp = usePath + path;
	//doLog( "append:", tmp );
	tmp = tmp.replace( /[/\\]\.[/\\]/g , '/' );
	tmp = tmp.replace( /([^.]\.|\.[^.]|[^.][^.])[^/\\]*[/\\]\.\.[/\\]/g , '' );
	tmp = tmp.replace( /([^.]\.|\.[^.]|[^.][^.])[^/\\]*[/\\]\.\.$/g , '' );
	while( ( newTmp = tmp.replace( /[/\\][^/\\\.]*[/\\]\.\.[/\\]/, '/' ) ) !== tmp ) {
		tmp = newTmp;
	}
	tmp = tmp.replace( /[^/\\]*[/\\]\.\.[/\\]/g , '' );
	tmp = tmp.replace( /[^/\\]*[/\\]\.\.$/g , '' );
	//doLog( "final otuput:", tmp );
	return tmp;
}
sandboxRequire.resolve = sandboxRequireResolve;
