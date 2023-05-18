import { MarionetteClient } from "../lib/index.mjs";

const marionetteClient = new MarionetteClient();

afterAll(() => {
  marionetteClient.close();
});

test("createClient TEST", () => {
  console.log(marionetteClient["peerConnection"]);
});
