export type Vector3Tuple = [number, number, number];

export interface Spatial3DNodeData {
  id: string;
  title: string;
  subtitle?: string;
  nodeIndex?: number;
  type?: string;
  position: Vector3Tuple;
  rotation?: Vector3Tuple;
  content: React.ReactNode;
  accentColor?: string;
}

export type CameraPreset = 'overview' | 'rover' | string;
