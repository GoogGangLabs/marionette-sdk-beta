import { MarionetteClient } from "../src/index";

const marionetteClient = new MarionetteClient();

afterAll(() => {
  marionetteClient.close();
});

test("createClient TEST", () => {
  console.log(marionetteClient["peerConnection"]);
});
