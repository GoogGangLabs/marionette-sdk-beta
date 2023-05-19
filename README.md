# Marionette SDK

<img width="2510" alt="Marionette_Architecture" src="https://github.com/GoogGangLabs/marionette-sdk-beta/assets/74334399/fc5cbc42-457d-4f05-aad0-b371ccff2b57">

<br>

The Marionette SDK provides real-time Deep-learning Inference results using WebRTC and WebSockets.<br>
For easy use, users can manage video streams and perform deep learning inference with just an abstracted method call.<br>

<br>

**WebRTC**

- Extracts video streams from the user's webcam.
- Communicates with the media server.
- Encodes the video stream into H.264 and sends it to the server.

<br>

**WebSockets**

- Receives up to 30 deep learning results per second.
- Sends debugging results to the server to save SDK usage logs.

<br>

## Get started

```SHELL
# Yarn
yarn add marionette-sdk-beta

# NPM
npm install marionette-sdk-beta
```

<br>

## Usage

<br>

### Import module

```TS
/* ES Module */
import { MarionetteClient } from 'marionette-sdk';

/* Common JS */
const { MarionetteClient } = require('marionette-sdk');

/* CDN */
<script src="https://unpkg.com/marionette-sdk-beta/lib/index.min.js"></script>
```

<br>

### Initialize Marionette Client

This is a method that allows you to register a Session with the server after going through the authentication process using the access code assigned to each user.<br>
If you need an Access Code, please contact jc@goodganglabs.com and we will send it to you.<br>

```TS
/* CDN */
const marionetteClient = MarionetteClient.getClient();

/* Other Modules */
const marionetteClient = new MarionetteClient();

await marionetteClient.createClient('Access Code');
```

<br>

### Get video stream

This is a method to extract video streams.<br>
The extracted video stream is stored within the `MarionetteClient` object.<br>

```TS
const devices = await marionetteClient.getDevices();

interface StreamConfigurations {
  /*
    identifier for the webcam device.

    Default: default webcam identifier on your computer.
  */
  deviceId?: string;

  /*
    Width value of the video stream.

    Default: 320
    Valid range: 100 ~ 640
  */
  width?: number;

  /*
    Height value of the video stream.

    Default: 240
    Valid range: 100 ~ 480
  */
  height?: number;

  /*
    Number of frames per second.

    Default: 30
    Valid range: 10 ~ 30
  */
  frameRate?: number;

  /*
    Maximum bitrate transmitted per frame.

    Default: 100,000
    Valid range: 30,000 ~ 300,0000
  */
  bitrate?: number;

  /*
    Protocol for WebRTC communication.

    Default: 'STUN'
  */
  candidateType?: 'STUN' | 'TURN';

  /*
    Deep learning inference model.

    Default: 'Holistic'
    Desc: Holistic includes Face, Body, and Hand.
  */
  model?: 'Holistic' | 'Face' | 'Body' | 'Hand';

  /*
    Processor for deep learning inference

    Default: 'GPU'
  */
  processor?: 'GPU' | 'CPU';

  /*
    If true, the usage log is delivered to the web hook when the session is terminated (WebRTC stop).
    Data recorded during one session, such as average fps, latency, and data size.

    Default: false
  */
  debug?: boolean;
}

await marionetteClient.loadStream(StreamConfigurations);

// Please refer to the Example Code below.
const videoElement = document.getElementById('video');
const stream = marionetteClient.getStream();

videoElement.srcObject = stream;
videoElement.play();
```

<br>

### Publish video stream

This is a method for connecting to a media server and transmitting a video stream via WebRTC.<br>
It is implemented with the logic necessary for WebRTC communication, such as exchanging SDP information, collecting ICE Candidates, and communication.<br>

```TS
await marionetteClient.publish();

// Terminate communication with the server.
marionetteClient.stop();
```

<br>

### Event listener - `LOAD_STREAM`

Event that operates when webcam video stream extraction is complete.<br>
A **MediaStream** object from the WebRTC API is returned.<br>

```TS
marionetteClient.on('LOAD_STREAM', (stream: MediaStream) => {});
```

<br>

### Event listener - `ICE_CANDIDATE`

It represents the ICE candidate status of WebRTC for communication with the server.<br>
If the status is 'complete', communication with the server will begin soon.<br>

```TS
type RTCIceGatheringState = "complete" | "gathering" | "new";

marionetteClient.on('ICE_CANDIDATE', (state: RTCIceGatheringState) => {});
```

<br>

### Event listener - `INFERENCE_RESULT`

This is an Event that delivers deep learning inference results.<br>
It is an event that occurs after the video stream is sent to the server via WebRTC and the deep learning inference is completed.<br>

```TS
/*
  Each coordinate is a value between 0 and 1, with a precision of 16 digits.

  X: Represents the horizontal position in the frame. The closer to 0, the closer to the left side of the image, and the closer to 1, the closer to the right side of the image.
  Y: Represents the vertical position in the frame. The closer to 0, the closer to the top of the image, and the closer to 1, the closer to the bottom of the image.
  Z: Represents the distance between the camera and the subject in the frame. The lower the Z value, the closer the position is to the camera, and the higher it is, the farther away from the camera it means.
  Visibility: A value indicating the likelihood of the landmark being visible in the image.
*/
interface LandmarkResult {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

interface InferenceResult {
  /*
    Collection of detected/tracked faces.
    Where each face is represented as a list of 468 face landmarks and each landmark is composed of x, y and z.
  */
  face: LandmarkResult[];

  /*
    Collection of detected/tracked hands.
    Where each hand is represented as a list of 21 hand landmarks and each landmark is composed of x, y and z.
  */
  left_hand: LandmarkResult[];
  right_hand: LandmarkResult[];

  /*
    Collection of detected/tracked pose.
    Where each pose is represented as a list of 21 pose landmarks and each landmark is composed of x, y, z, visibility.
  */
  pose: LandmarkResult[];

  /*
    x, y and z: Real-world 3D coordinates in meters with the origin at the center between hips.
    visibility: Identical to that defined in the corresponding pose_landmarks.
  */
  pose_world: LandmarkResult[];
}

marionetteClient.on('INFERENCE_RESULT', (result: InferenceResult) => {});
```

<br>

### Event listener - `ERROR`

It returns all errors that occur while using the SDK.<br>
Each error message is returned according to the defined Enum.<br>

```TS
const ErrorMessage = {
  UNAUTHORIZED: "UNAUTHORIZED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;
type ErrorMessage = (typeof ErrorMessage)[keyof typeof ErrorMessage];

marionetteClient.on('ERROR', (error: ErrorMessage) => {});
```

<br>

## Example Code

```TS
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Marionette SDK</title>
    <script src="https://unpkg.com/marionette-sdk-beta/lib/index.min.js"></script>
    <style>
      button {
        width: 150px;
        height: 60px;
        margin: 20px 10px;
      }

      video, canvas {
        position: absolute;
      }
    </style>
  </head>
  <body>
    <button onclick="handleStart()">start</button>
    <button onclick="handleStop()">stop</button>
    <video id="video" width="640px" height="480px"></video>
    <canvas id="guide"></canvas>

    <script>
      const marionetteClient = MarionetteClient.getClient();

      const handleStart = async () => {
        const video = document.getElementById("video");
        const canvas = document.getElementById("guide");
        canvas.width = video.width;
        canvas.height = video.height;

        marionetteClient.on("LOAD_STREAM", async (stream) => {
          const videoElement = document.getElementById("video");
          videoElement.srcObject = stream;
          videoElement.play();
        });

        marionetteClient.on("INFERENCE_RESULT", (result) => {
          /*
            When the deep learning results are received,
            you can visualize the results by passing them to the method below.
          */
          marionetteClient.drawUtils(canvas, result);
        });

        marionetteClient.on("ICE_CANDIDATE", (state) => {
          console.log(state);
        });

        marionetteClient.on("ERROR", (error) => {
          console.log(error);
        });

        /* Input your access code */
        await marionetteClient.createClient("Access Code");
        await marionetteClient.loadStream();
        await marionetteClient.publish();
      };

      const handleStop = () => {
        marionetteClient.stop();
      };
    </script>
  </body>
</html>
```
