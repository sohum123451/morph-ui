export type Vector3Tuple = [number, number, number];

export interface Spatial3DNodeData {
  id: string;
  title: string;
  tag: string;
  status: 'synced' | 'streaming' | 'active' | 'standby';
  position: Vector3Tuple;
  accentColor: string;
  content: React.ReactNode;
}

export type CameraViewMode = 'overview' | 'station' | 'tactical_flight';
