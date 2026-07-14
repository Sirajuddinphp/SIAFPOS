const ESC=0x1b,GS=0x1d;
export function escposDocument(lines:string[],opts:{cut:boolean;drawer:boolean}){const chunks:Buffer[]=[Buffer.from([ESC,0x40])];for(const line of lines)chunks.push(Buffer.from(`${line}\n`,`utf8`));chunks.push(Buffer.from("\n\n","utf8"));if(opts.drawer)chunks.push(Buffer.from([ESC,0x70,0x00,0x19,0xfa]));if(opts.cut)chunks.push(Buffer.from([GS,0x56,0x00]));return Buffer.concat(chunks);}
export function center(text:string,width:number){const value=text.slice(0,width);return " ".repeat(Math.max(0,Math.floor((width-value.length)/2)))+value;}
export function columns(left:string,right:string,width:number){const l=left.slice(0,Math.max(1,width-right.length-1));return l+" ".repeat(Math.max(1,width-l.length-right.length))+right.slice(0,width);}
