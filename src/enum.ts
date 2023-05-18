const EventStatus = {
  LOAD_STREAM: "LOAD_STREAM",
  ICE_CANDIDATE: "ICE_CANDIDATE",
  INFERENCE_RESULT: "INFERENCE_RESULT",
  ERROR: "ERROR",
} as const;
type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

const ErrorMessage = {
  UNAUTHORIZED: "UNAUTHORIZED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;
type ErrorMessage = (typeof ErrorMessage)[keyof typeof ErrorMessage];

const CandidateType = {
  STUN: "STUN",
  TURN: "TURN",
} as const;
type CandidateType = (typeof CandidateType)[keyof typeof CandidateType];

const InferenceType = {
  HOLISTIC: "Holistic",
  Face: "Face",
  Pose: "Pose",
  Hand: "Hand",
} as const;
type InferenceType = (typeof InferenceType)[keyof typeof InferenceType];

const ProcessorType = {
  GPU: "GPU",
  CPU: "CPU",
} as const;
type ProcessorType = (typeof ProcessorType)[keyof typeof ProcessorType];

export { ErrorMessage, EventStatus, CandidateType, InferenceType, ProcessorType };
