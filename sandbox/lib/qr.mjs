import qrcode from '../vendor/qrcode.mjs';
import {deflateSync} from 'node:zlib';
const crcTable=Array.from({length:256},(_,value)=>{
  for(let k=0;k<8;k++)value=value&1?0xedb88320^(value>>>1):value>>>1;return value>>>0;
});
function chunk(type,data){
  const name=Buffer.from(type);const body=Buffer.concat([name,data]);let crc=0xffffffff;
  for(const byte of body)crc=crcTable[(crc^byte)&255]^(crc>>>8);
  const length=Buffer.alloc(4);length.writeUInt32BE(data.length);const checksum=Buffer.alloc(4);checksum.writeUInt32BE((crc^0xffffffff)>>>0);
  return Buffer.concat([length,body,checksum]);
}
export function qrPixels(text,scale=5){
  const qr=qrcode(0,'M');qr.addData(text);qr.make();const count=qr.getModuleCount();const width=(count+8)*scale;
  const data=new Uint8ClampedArray(width*width*4);data.fill(255);
  for(let row=0;row<count;row++)for(let col=0;col<count;col++)if(qr.isDark(row,col))
    for(let y=0;y<scale;y++)for(let x=0;x<scale;x++){
      const at=(((row+4)*scale+y)*width+(col+4)*scale+x)*4;data[at]=data[at+1]=data[at+2]=0;
    }
  return {data,width,height:width};
}
export function qrPng(text){
  const {data,width,height}=qrPixels(text);const raw=Buffer.alloc((width*4+1)*height);
  for(let y=0;y<height;y++)Buffer.from(data.buffer,y*width*4,width*4).copy(raw,y*(width*4+1)+1);
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
