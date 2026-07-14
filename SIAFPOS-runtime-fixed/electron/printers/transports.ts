import { promises as fs } from "node:fs";
import net from "node:net";
import type { PrinterProfile } from "../../shared/contracts/printer-contracts";
export async function sendToPrinter(printer:PrinterProfile,data:Buffer):Promise<void>{
 if(printer.connectionType==="mock")return;
 if(printer.connectionType==="usb"){if(!printer.devicePath)throw new Error("Printer device path is missing.");await fs.appendFile(printer.devicePath,data);return;}
 if(!printer.host||!printer.port)throw new Error("LAN printer host/port is missing.");
 await new Promise<void>((resolve,reject)=>{const socket=net.createConnection({host:printer.host!,port:printer.port!},()=>socket.end(data));const timer=setTimeout(()=>socket.destroy(new Error("Printer connection timed out.")),5000);socket.once("error",e=>{clearTimeout(timer);reject(e);});socket.once("close",hadError=>{clearTimeout(timer);if(!hadError)resolve();});});
}
export async function diagnose(printer:PrinterProfile):Promise<{reachable:boolean;message:string}>{if(printer.connectionType==="mock")return{reachable:true,message:"Mock printer is ready."};if(printer.connectionType==="usb"){if(!printer.devicePath)return{reachable:false,message:"Device path is missing."};try{await fs.access(printer.devicePath);return{reachable:true,message:"USB/shared device path is accessible."};}catch(e){return{reachable:false,message:e instanceof Error?e.message:"Device path unavailable."};}}return await new Promise(resolve=>{if(!printer.host||!printer.port)return resolve({reachable:false,message:"Host/port is missing."});const s=net.createConnection({host:printer.host,port:printer.port});const t=setTimeout(()=>{s.destroy();resolve({reachable:false,message:"Connection timed out."});},3000);s.once("connect",()=>{clearTimeout(t);s.destroy();resolve({reachable:true,message:"LAN printer accepted connection."});});s.once("error",e=>{clearTimeout(t);resolve({reachable:false,message:e.message});});});}
