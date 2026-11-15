// Some Safari versions expose createImageBitmap but reject supported image blobs.
export async function decodeFrame(blob){
 if(typeof createImageBitmap==='function'){
  try{return await createImageBitmap(blob)}catch{/* Fall back to the image decoder. */}
 }
 return new Promise((resolve,reject)=>{
  const image=new Image(),url=URL.createObjectURL(blob);
  image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};
  image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Frame decode failed'))};
  image.src=url;
 });
}
