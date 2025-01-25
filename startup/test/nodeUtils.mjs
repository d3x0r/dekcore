import {sack} from "sack.vfs";
const disk = sack.Volume();

let packageRoot = null;
let relRoot = "";
{
	let here = process.cwd().split(/[\/\\]/);
	let leader = here.length;
	while( !packageRoot && leader > 0 ) {
		const root = here.slice(0,leader--).join('/');
		if( disk.exists( root + "/package.json" ) ) {
			if( disk.isDir( root + "/node_modules" ) ) {
				//if( relRoot.length ) relRoot += "/..";
				//else relRoot = ".."
				packageRoot = root;
				break;
			}
		}
		if( relRoot.length ) relRoot += "/..";
		else relRoot = "..";
	}
}


export	function findModule( spec, referrer, relative ) {
		console.log( "Parent got anything?", referrer );
		const specPath = spec[0] === '/' ?spec.substr( 1 ).split('/'):spec.split('/' );
		let content = null;

		//console.log("Find module:", spec, leader, here );
		let n = 1;
		let a = "";
		while( n <= specPath.length && disk.isDir( a = packageRoot + "/node_modules" + "/" + specPath.slice(0,n).join('/') ) ) {
			n++;
			;//console.log( "still goood", a );
		}
		n--;
		const relPath = "/node_modules/" + specPath.slice(0,n).join('/') + "/";
		//const filePart = specPath.slice(n-1);

		//console.log( "Even have node_modules..." );
		let modPath = relative?relRoot+relPath:(packageRoot + relPath);
		const pkgDef = modPath + "package.json";
		if( disk.exists( pkgDef ) ) {
			const module = disk.readJSOX( pkgDef, (pkg)=>{
				if( n < specPath.length ) {
					const def = pkg.exports["./"+specPath[n]];
					if( def ) {
						if( def.import ) modPath = modPath + def.import.substring(2);
						else if( def.default ) modPath = modPath + def.default.substring(2);
						else if( "string" === typeof def ) modPath = relPath + "/"+ def;
					}else {
						console.log( "Extra?", pkg.exports) ;
					}
				}else {
					modPath = modPath + ( pkg.module || pkg.main );
				}
			} );
			return modPath;
		}
		return null;
	}
