import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from "@dfinity/auth-client";
import { idlFactory as plumbum_idl, canisterId as plumbum_id } from 'dfx-generated/plumbum';

const MAX_CHUNK_SIZE = 1024 * 500; // 500kb

// Divides the file into chunks and uploads them to the canister in sequence
async function processAndUploadChunk(
  fileBuffer,
  byteStart,
  fileSize,
  fileId,
  chunk,
  plumbum
) {
  const fileSlice = fileBuffer.slice(
    byteStart,
    Math.min(fileSize, byteStart + MAX_CHUNK_SIZE)
  );
  const sliceToNat = encodeArrayBuffer(fileSlice);
  //console.log("slice")
  //console.log(sliceToNat)
  plumbum.putFileChunk(fileId, chunk, sliceToNat);
  //console.log("done")
  return 1;
}

const encodeArrayBuffer = (file) =>
  Array.from(new Uint8Array(file));

function getFileInit(
    userId,
    file
  ) {
    const chunkCount = Number(Math.ceil(file.size / MAX_CHUNK_SIZE));
    return {
      chunkCount,
      createdAt: Number(Date.now() * 1000), // motoko is using nanoseconds
      name: file.name,
      userId: userId,
      mimeType: file.type,
      marked: false
    };
}

// Wraps up the previous functions into one step for the UI to trigger
async function uploadFile(file, plumbum) {
  const fileBuffer = (await file.arrayBuffer()) || new ArrayBuffer(0);
  const userId = await plumbum.getOwnId();
  const fileInit = getFileInit(userId, file);
  console.log("here");
  console.log(fileInit);
  let fileId = await plumbum.createFile(fileInit);
  console.log(fileId);
  fileId = fileId[0]

  let file_obj = {
    chunkCount: fileInit["chunkCount"],
    createdAt: fileInit["createdAt"],
    fileId: fileId,
    name: file.name,
    userId: userId
  }

  let chunk = 1;
  
  for (
    let byteStart = 0;
    byteStart < file.size;
    byteStart += MAX_CHUNK_SIZE, chunk++
  ) {
    await processAndUploadChunk(fileBuffer, byteStart, file.size, fileId, chunk, plumbum)
    if(chunk >= fileInit["chunkCount"]){
      return(file_obj)
    }
  }
}

export async function useUploadFile(file) {
  const authClient = await AuthClient.create();
  const identity = await authClient.getIdentity();
  const agent = new HttpAgent({ identity });
  const plumbum = Actor.createActor(plumbum_idl, { agent, canisterId: plumbum_id });
  console.info("Storing File...");
  try {
    console.time("Stored in");
    const file_obj = await uploadFile(file, plumbum);
    console.timeEnd("Stored in");
    console.log("k");
    let k = await plumbum.getFileInfo(file_obj["fileId"]);
    console.log(k);
    return(file_obj);
  } catch (error) {
    console.error("Failed to store file.", error);
    return(0);
  }
}