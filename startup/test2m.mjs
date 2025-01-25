


export default globalThis;

const  util=(await import("util")).default;
const {sack}=(await import("sack.vfs"));

const x = (await new Promise( (res)=>{res(true)} ));