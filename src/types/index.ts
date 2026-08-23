export type DeviceType = 'chromebook' | 'mouse' | 'earphone';

export type DeviceStatus = 'normal' | 'repair' | 'broken';

export type MouseType = 'wired' | 'wireless';

export type Manufacturer = '삼성전자' | 'LG' | 'LG전자' | '레노버' | 'ASUS' | '기타';

export interface DeviceHistoryItem {
  id: string;
  date: string;
  previousStatus: DeviceStatus;
  newStatus: DeviceStatus;
  description: string;
  userName: string;
}

export interface Device {
  id: string;
  deviceType: DeviceType;
  managementNumber: string; // 학교 자산 관리번호 (초기 빈칸, 추후 입력 가능)
  classDeviceNumber?: number; // 학급 내 반 번호 (1번 ~ 20번 등)
  deviceName: string;
  modelName: string;
  manufacturer: string;
  mouseType?: MouseType;
  location: string;
  grade?: number;
  classNum?: number;
  status: DeviceStatus;
  issueDescription?: string;
  repairDescription?: string;
  createdAt: string;
  updatedAt: string;
  note?: string;
  history?: DeviceHistoryItem[];
}

export interface ConsumableInventory {
  id: string;
  location: string; // 학급 또는 보관소명
  deviceType: 'mouse' | 'earphone';
  mouseWiredCount: number;
  mouseWirelessCount: number;
  earphoneCount: number;
  mouseSpareCount: number;
  earphoneSpareCount: number;
  requestMemo?: string;
  updatedAt: string;
}

export interface ClassInfo {
  grade: number;
  classNum: number;
  name: string;
}

export interface SystemConfig {
  schoolName: string;
  systemName: string;
  academicYear: string;
  digitalTutorName: string;
  deviceTeacherName: string;
  userRole: 'tutor' | 'teacher' | 'admin';
  customGrades?: number[];
  customClasses?: Record<number, number[]>; // grade -> list of class numbers
  customSpecialRooms?: string[];
}

export interface DeviceFilterState {
  searchQuery: string;
  deviceType: 'all' | DeviceType;
  status: 'all' | DeviceStatus;
  manufacturer: 'all' | string;
  location: 'all' | string;
  mouseType: 'all' | MouseType;
  sortBy: 'managementNumber' | 'updatedAt' | 'location' | 'status';
  sortOrder: 'asc' | 'desc';
}
