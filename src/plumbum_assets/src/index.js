import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as plumbum_idl, canisterId as plumbum_id } from 'dfx-generated/plumbum';

const agent = new HttpAgent();
const plumbum = Actor.createActor(plumbum_idl, { agent, canisterId: plumbum_id });

document.getElementById("clickMeBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.toString();
  const greeting = await plumbum.greet(name);

  document.getElementById("greeting").innerText = greeting;
});
