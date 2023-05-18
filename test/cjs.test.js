const { MarionetteClient } = require("../lib/index.cjs");

const marionetteClient = new MarionetteClient();

afterAll(() => {
  marionetteClient.close();
});

test("createClient TEST", () => {
  console.log(marionetteClient["peerConnection"]);
});
