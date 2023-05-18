import { EventEmitter } from "events";
import { io, Socket } from "socket.io-client";
import protobuf from "protobufjs";

import { DebugDataSet, StreamConfigurations, InferenceResult, StreamResponse } from "./types";
import { ErrorMessage, EventStatus, InferenceType, CandidateType, ProcessorType } from "./enum";
import { drawConnectors, drawLandmarks, HAND_CONNECTIONS, POSE_CONNECTIONS, FACEMESH_TESSELATION } from "./draw";

const protoSchema = `
syntax = "proto3";

package streampackage;

message LandmarkResult {
  float x = 1;
  float y = 2;
  float z = 3;
  float visibility = 4;
}

message InferenceResult {
  repeated LandmarkResult face = 1;
  repeated LandmarkResult left_hand = 2;
  repeated LandmarkResult right_hand = 3;
  repeated LandmarkResult pose = 4;
  repeated LandmarkResult pose_world = 5;
}

message StreamResponse {
  string sessionId = 1;
  int32 fps = 2;
  uint32 sequence = 3;
  uint32 startedAt = 4;
  repeated uint32 timestamp = 5;
  repeated int32 step = 6;
  repeated int32 dataSize = 7;
  InferenceResult result = 8;
}
`;

const host = "https://api.goodganglabs.xyz";
const protobufRoot = protobuf.parse(protoSchema, { keepCase: true }).root;
const streamMessage = protobufRoot.lookupType("streampackage.StreamResponse");

class MarionetteClient {
  public config: StreamConfigurations = {};

  private event = new EventEmitter();
  private peerConnection: RTCPeerConnection;
  private signalSocket: Socket;
  private resultSocket: Socket;
  private publishFlag = false;
  private stream: MediaStream;
  private debugDataSet: DebugDataSet;

  constructor() {
    this.signalSocket = io(host, { path: "/stream" });
    this.resultSocket = io(host, { path: "/result" });

    this.config.width = 320;
    this.config.height = 240;
    this.config.frameRate = 30;
    this.config.bitrate = 50000;
    this.config.candidateType = CandidateType.STUN;
    this.config.model = [InferenceType.HOLISTIC];
    this.config.processor = ProcessorType.GPU;
    this.config.debug = false;
  }

  public createClient = async (password: string): Promise<void> => {
    await fetch(`${host}/api/code`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: password }),
    }).catch(() => {
      this.event.emit(EventStatus.ERROR, { message: ErrorMessage.UNAUTHORIZED });
    });
    this.peerConnection = await this.createPeerConnection();
    this.resultSocket.emit("enterSession", { sessionId: this.signalSocket.id });
    this.signalSocket.emit("enterSession");
  };

  public getDevices = async () => {
    return (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "videoinput");
  };

  public loadStream = async (config?: StreamConfigurations) => {
    this.setStreamConfiguration(config);
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: this.config.deviceId,
        width: this.config.width,
        height: this.config.height,
        frameRate: this.config.height,
      },
    });
    this.stream.getTracks().forEach((track) => this.peerConnection.addTrack(track, this.stream));
    this.event.emit(EventStatus.LOAD_STREAM, this.stream);
  };

  public getStream = () => this.stream;

  public on = (event: EventStatus, listener: (...args: any[]) => void) => this.event.on(event, listener);

  public publish = async () => {
    if (this.publishFlag) return;
    this.publishFlag = true;
    const offer = await this.peerConnection.createOffer();
    const setBitrate = async () => {
      const sender = this.peerConnection.getSenders()[0];
      const parameters = sender.getParameters();

      if (!parameters.encodings) parameters.encodings = [{}];
      parameters.encodings[0].maxBitrate = this.config.bitrate;
      await sender.setParameters(parameters).catch(() => {});
    };
    const waitIceCandidate = async () => {
      return await new Promise((resolve) => {
        if (this.peerConnection.iceGatheringState === "complete") resolve(null);
        else {
          const checkState = () => {
            this.event.emit(EventStatus.ICE_CANDIDATE, { state: this.peerConnection.iceConnectionState });
            if (this.peerConnection.iceGatheringState === "complete") {
              this.peerConnection.removeEventListener("icegatheringstatechange", checkState);
              resolve(null);
            }
          };
          this.peerConnection.addEventListener("icegatheringstatechange", checkState);
        }
      });
    };

    await setBitrate();
    await this.peerConnection.setLocalDescription(offer);
    await waitIceCandidate();
    this.sdpFilterCodec("video", "H264/90000");

    const localOffer = this.peerConnection.localDescription;
    const answer = await (
      await fetch(`${host}/api/offer`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.signalSocket.id,
          sdp: localOffer!.sdp,
          type: localOffer!.type,
          processor: this.config.processor,
          model: this.config.model,
        }),
      })
    ).json();

    if (this.config.debug) this.initDebugDataSet();
    this.peerConnection.setRemoteDescription(answer);
    this.resultSocket.on("stream_output", this.dataHandler);
  };

  public drawUtils = (canvas: HTMLCanvasElement, result: InferenceResult) => {
    const context = canvas.getContext("2d");

    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (result.pose && result.pose.length > 0) {
      for (let i = 0; i < 23; i++) {
        if (i > 10 && i < 17) continue;
        result.pose[i] = { x: 0, y: 0, z: 0, visibility: 0 };
      }
    }

    drawConnectors(context, result.pose, POSE_CONNECTIONS, { color: "#00cff7", lineWidth: this.getLineWidth(4) });
    drawLandmarks(context, result.pose, { color: "#ff0364", lineWidth: this.getLineWidth(2, false) });
    drawConnectors(context, result.face, FACEMESH_TESSELATION, {
      color: "#C0C0C070",
      lineWidth: this.getLineWidth(1),
    });
    drawConnectors(context, result.left_hand, HAND_CONNECTIONS, {
      color: "#eb1064",
      lineWidth: this.getLineWidth(5),
    });
    drawLandmarks(context, result.left_hand, { color: "#00cff7", lineWidth: this.getLineWidth(2, false) });
    drawConnectors(context, result.right_hand, HAND_CONNECTIONS, {
      color: "#22c3e3",
      lineWidth: this.getLineWidth(5),
    });
    drawLandmarks(context, result.right_hand, { color: "#ff0364", lineWidth: this.getLineWidth(2, false) });
  };

  public stop = () => {
    if (!this.publishFlag) return;
    this.publishFlag = false;
    this.stream.getTracks().forEach((track) => track.stop());
    this.peerConnection.getTransceivers().forEach((transceiver) => transceiver.stop());
    this.peerConnection.getSenders().forEach((sender) => {
      if (sender.track) sender.track.stop();
    });
    this.peerConnection.close();
    this.peerConnection = undefined;
    this.stream = undefined;
    this.signalSocket.emit("leaveSession");

    if (this.config.debug) this.sendDebugData();
  };

  public close = () => {
    this.signalSocket.disconnect();
    this.resultSocket.disconnect();
    this.signalSocket = undefined;
    this.resultSocket = undefined;
  };

  private createPeerConnection = async () => {
    const turnInfo = await (await fetch(`${host}/api/credential`, { method: "GET" })).json();
    const iceServers = [
      { urls: ["stun:stun.l.google.com:19302"] },
      {
        urls: "turn:turn.goodganglabs.xyz:3478",
        username: turnInfo.username,
        credential: turnInfo.credential,
      },
    ];
    return new RTCPeerConnection({ iceServers });
  };

  private sdpFilterCodec = (kind: string, codec: string) => {
    const offer = this.peerConnection!.localDescription;
    const allowed: number[] = [];
    const rtxRegex = new RegExp("a=fmtp:(\\d+) apt=(\\d+)\r$");
    const codecRegex = new RegExp("a=rtpmap:([0-9]+) " + this.escapeRegExp(codec));
    const videoRegex = new RegExp("(m=" + kind + " .*?)( ([0-9]+))*\\s*$");

    const lines = offer!.sdp.split("\n");

    let isKind = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("m=" + kind + " ")) {
        isKind = true;
      } else if (lines[i].startsWith("m=")) {
        isKind = false;
      }

      if (isKind) {
        let match = lines[i].match(codecRegex);
        if (match) allowed.push(parseInt(match[1]));

        match = lines[i].match(rtxRegex);
        if (match && allowed.includes(parseInt(match[2]))) {
          allowed.push(parseInt(match[1]));
        }
      }
    }

    const skipRegex = "a=(fmtp|rtcp-fb|rtpmap):([0-9]+)";
    let sdp = "";

    isKind = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("m=" + kind + " ")) {
        isKind = true;
      } else if (lines[i].startsWith("m=")) {
        isKind = false;
      }

      if (isKind) {
        const skipMatch = lines[i].match(skipRegex);
        if (skipMatch && !allowed.includes(parseInt(skipMatch[2]))) {
          continue;
        } else if (lines[i].match(videoRegex)) {
          sdp += lines[i].replace(videoRegex, "$1 " + allowed.join(" ")) + "\n";
        } else {
          sdp += lines[i] + "\n";
        }
      } else {
        sdp += lines[i] + "\n";
      }
    }

    return sdp;
  };

  private escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  private dataHandler = (buffer: Uint16Array) => {
    const decoded = streamMessage.decode(new Uint8Array(buffer));
    const data = streamMessage.toObject(decoded, {
      longs: String,
      enums: String,
      bytes: String,
    }) as StreamResponse;
    const results: InferenceResult = data.result;
    this.event.emit(EventStatus.INFERENCE_RESULT, results);
    if (this.config.debug) this.setDebugData(data);
  };

  private getLineWidth = (width: number, line = true) => {
    return width * Math.pow(this.config.width / 640, line ? 1 : 2);
  };

  private setStreamConfiguration = (config?: StreamConfigurations) => {
    this.config.deviceId = config.deviceId || this.config.deviceId;
    this.config.width = config.width || this.config.width;
    this.config.height = config.height || this.config.height;
    this.config.frameRate = config.frameRate || this.config.frameRate;
    this.config.bitrate = config.bitrate || this.config.bitrate;
    this.config.candidateType = config.candidateType || this.config.candidateType;
    this.config.model = config.model || this.config.model;
    this.config.processor = config.processor || this.config.processor;
    this.config.debug = config.debug || this.config.debug;
  };

  private initDebugDataSet = () => {
    this.debugDataSet.latency.input = [];
    this.debugDataSet.latency.output = [];
    this.debugDataSet.latency.inference = [];
    this.debugDataSet.latency.grpc = [];
    this.debugDataSet.latency.client = [];
    this.debugDataSet.dataSize.input = [];
    this.debugDataSet.dataSize.output = [];
    this.debugDataSet.fps = [];
    this.debugDataSet.startedAt = Date.now();
    this.debugDataSet.totalCount = 0;
    this.debugDataSet.frameRate = this.config.frameRate;
    this.debugDataSet.width = this.config.width;
    this.debugDataSet.height = this.config.height;
  };

  private setDebugData = (data: StreamResponse) => {
    this.debugDataSet.totalCount++;
    if (this.debugDataSet.totalCount <= 10) return;
    this.debugDataSet.latency.input.push(data.step[0]);
    this.debugDataSet.latency.grpc.push(data.step[1]);
    this.debugDataSet.latency.inference.push(data.step[2]);
    this.debugDataSet.latency.output.push(data.step[3]);
    this.debugDataSet.latency.client.push(data.step[4]);
    this.debugDataSet.dataSize.input.push(data.dataSize[0]);
    this.debugDataSet.dataSize.output.push(data.dataSize[1]);
    this.debugDataSet.fps.push(data.fps);
  };

  private sendDebugData = () => {
    this.resultSocket.emit("sendSlack", this.debugDataSet);
  };
}

export { MarionetteClient };
