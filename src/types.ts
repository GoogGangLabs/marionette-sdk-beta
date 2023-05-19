import { OneEuroFilter } from "./filter";
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

export interface LandmarkResult {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export type LandmarkResultList = LandmarkResult[];

export interface InferenceResult {
  face: LandmarkResult[];
  left_hand: LandmarkResult[];
  right_hand: LandmarkResult[];
  pose: LandmarkResult[];
  pose_world: LandmarkResult[];
}

export interface EuroFilterLandmark {
  x: OneEuroFilter;
  y: OneEuroFilter;
  z: OneEuroFilter;
}

export interface EuroFilter {
  face: EuroFilterLandmark[];
  left_hand: EuroFilterLandmark[];
  right_hand: EuroFilterLandmark[];
  pose: EuroFilterLandmark[];
  pose_world: EuroFilterLandmark[];
}

export interface StreamResponse {
  sessionId: string;
  fps: number;
  sequence: number;
  startedAt: number;
  timestamp: number[];
  step: number[];
  dataSize: number[];
  result: InferenceResult;
}

export type LandmarkConnectionArray = Array<[number, number]>;

export type Fn<I, O> = (input: I) => O;

export interface Data {
  index?: number;
  from?: LandmarkResult;
  to?: LandmarkResult;
}

export interface DrawingOptions {
  color?: string | CanvasGradient | CanvasPattern | Fn<Data, string | CanvasGradient | CanvasPattern>;
  fillColor?: string | CanvasGradient | CanvasPattern | Fn<Data, string | CanvasGradient | CanvasPattern>;
  lineWidth?: number | Fn<Data, number>;
  radius?: number | Fn<Data, number>;
  visibilityMin?: number;
}
