
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CREATOR_BRICK = 'CREATOR_BRICK',
  CREATOR_LITHOPHANE = 'CREATOR_LITHOPHANE',
  CREATOR_VASE = 'CREATOR_VASE',
  CREATOR_GEAR = 'CREATOR_GEAR',
  CREATOR_SIGN = 'CREATOR_SIGN',
  CREATOR_VORONOI = 'CREATOR_VORONOI',
  CREATOR_SCREW = 'CREATOR_SCREW',
  CREATOR_LITHO_SPHERE = 'CREATOR_LITHO_SPHERE',
  CREATOR_TERRAIN = 'CREATOR_TERRAIN',
  CREATOR_FORGE = 'CREATOR_FORGE',
  CREATOR_CUBE = 'CREATOR_CUBE',
  INVENTORY = 'INVENTORY',
  COMMUNITY = 'COMMUNITY',
  FRIENDS = 'FRIENDS',
  CHAT = 'CHAT',
  PRIVATE_CHAT = 'PRIVATE_CHAT',
  SLICER_TOOL = 'SLICER_TOOL',
  SETTINGS = 'SETTINGS',
  LIVE_WORKSHOP = 'LIVE_WORKSHOP',
  UTILITY_HUB = 'UTILITY_HUB',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  VISION_LAB = 'VISION_LAB',
  MODEL_SCOUT = 'MODEL_SCOUT',
  GCODE_VIEWER = 'GCODE_VIEWER',
  GCODE_ANALYST = 'GCODE_ANALYST',
  DRYING_GUIDE = 'DRYING_GUIDE',
  FLEET_MANAGER = 'FLEET_MANAGER',
  SPOOL_MATH = 'SPOOL_MATH',
  STL_VIEWER = 'STL_VIEWER',
  FLOW_CALC = 'FLOW_CALC',
  PRINT_LOG = 'PRINT_LOG',
  COMPARE_LAB = 'COMPARE_LAB',
  SYNC_CENTER = 'SYNC_CENTER',
  QR_STUDIO = 'QR_STUDIO',
  AR_BED_PLACEMENT = 'AR_BED_PLACEMENT',
  PRINT_QUEUE = 'PRINT_QUEUE'
}

export type FilamentStatus = 'Inventory' | 'InPrinter' | 'Drying' | 'Empty';

export interface Filament {
  id: string;
  brand: string;
  material: string;
  color: string;
  hex: string;
  weight: number; 
  remaining: number; 
  price?: number;
  status: FilamentStatus;
  activePrinterId?: string;
  slotIndex?: number; 
  lastUsed?: string;
}

export type PrintStatus = 'Planned' | 'Printing' | 'Done' | 'Failed';

export interface Printer {
  id: string;
  name: string;
  model: string;
  nozzleSize: number;
  totalPrintTime: number; 
  lastMaintenance: string;
  status: 'Idle' | 'Printing' | 'Offline' | 'Error';
  slots?: number;
}

export interface PrintLogEntry {
  id: string;
  projectName: string;
  printerId: string;
  filamentId: string;
  startTime: string;
  duration: number;
  weight: number;
  status: 'Success' | 'Failed';
  notes: string;
  imageUrl?: string;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
  autoSync: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  isPro: boolean;
  joinedDate: string;
  githubConfig?: GitHubConfig;
}

export interface Friend extends User {
  isFollowing: boolean;
  status?: 'online' | 'printing' | 'offline';
  currentPrint?: string;
}

export interface PrivateMessage {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface MaintenanceTask {
  id: string;
  type: 'Nozzle' | 'Leveling' | 'Lube' | 'Belt';
  description: string;
  date: string;
}

export interface ProjectPart {
  id: string;
  name: string;
  grams: number;
  hours: number;
  status: PrintStatus;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  parts: ProjectPart[];
  filamentId?: string;
  createdAt: string;
  deadline?: string;
}

// Added missing Post interface for Community Hub
export interface Post {
  id: string;
  user: string;
  avatar: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
}

// Added missing ResinProfile interface for Resin Lab
export interface ResinProfile {
  id: string;
  brand: string;
  name: string;
  color: string;
  exposureTime: number;
  bottomExposure: number;
  pricePerLiter: number;
}

// Added missing Broadcast interface for Live Workshop
export interface Broadcast {
  id: string;
  userId: string;
  username: string;
  startTime: string;
  title: string;
}

// Added missing WebRTCSignal interface for peer-to-peer signaling
export interface WebRTCSignal {
  id: string;
  from: string;
  to: string;
  type: 'offer' | 'answer' | 'ice-candidate' | 'chat';
  data: any;
  timestamp: number;
}
