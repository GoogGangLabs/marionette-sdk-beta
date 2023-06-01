import { CandidateType, InferenceType, ProcessorType } from "./enum";

export interface DebugDataDetail {
  input: number[];
  output: number[];
  grpc?: number[];
  inference?: number[];
  client?: number[];
}

export interface DebugDataSet {
  latency: DebugDataDetail;
  dataSize: DebugDataDetail;
  fps: number[];
  startedAt: number;
  totalCount: number;
  frameRate: number;
  width: number;
  height: number;
}

export interface StreamConfigurations {
  deviceId?: string;
  width?: number;
  height?: number;
  frameRate?: number;
  bitrate?: number;
  candidateType?: CandidateType;
  model?: InferenceType[];
  processor?: ProcessorType;
  debug?: boolean;
}

export interface LandmarkPoint {
  x?: number;
  y?: number;
  z?: number;
  visibility?: number;
}

export type DeserializeLandmark = LandmarkPoint[];

export interface DeserializeLandmarks {
  face?: DeserializeLandmark;
  left_hand?: DeserializeLandmark;
  right_hand?: DeserializeLandmark;
  pose?: DeserializeLandmark;
  pose_world?: DeserializeLandmark;
}

export type SerializeLandmark = number[];

export interface SerializeLandmarks {
  face?: SerializeLandmark;
  left_hand?: SerializeLandmark;
  right_hand?: SerializeLandmark;
  pose?: SerializeLandmark;
  pose_world?: SerializeLandmark;
}

export interface StreamResponse {
  sessionId: string;
  fps: number;
  sequence: number;
  startedAt: number;
  timestamp: number[];
  step: number[];
  dataSize: number[];
  result: SerializeLandmarks;
}

export type LandmarkConnectionArray = Array<[number, number]>;

export type Fn<I, O> = (input: I) => O;

export interface Data {
  index?: number;
  from?: DeserializeLandmarks;
  to?: DeserializeLandmarks;
}

export interface DrawingOptions {
  color?: string | CanvasGradient | CanvasPattern | Fn<Data, string | CanvasGradient | CanvasPattern>;
  fillColor?: string | CanvasGradient | CanvasPattern | Fn<Data, string | CanvasGradient | CanvasPattern>;
  lineWidth?: number | Fn<Data, number>;
  radius?: number | Fn<Data, number>;
  visibilityMin?: number;
}
