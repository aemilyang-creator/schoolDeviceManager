import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Device, ConsumableInventory, SystemConfig, DeviceStatus } from '../types';
import { generateInitialDevices, generateInitialConsumables, INITIAL_SYSTEM_CONFIG } from '../data/initialData';
import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs
} from '../firebase';

interface DeviceStats {
  chromebook: {
    total: number;
    normal: number;
    repair: number;
    broken: number;
    operationalRate: number;
    byManufacturer: Record<string, { total: number; normal: number; repair: number; broken: number }>;
  };
  mouse: {
    total: number;
    wired: number;
    wireless: number;
    spare: number;
  };
  earphone: {
    total: number;
    assigned: number;
    spare: number;
  };
  overall: {
    totalAllDevices: number;
    totalNormal: number;
    totalRepair: number;
    totalBroken: number;
  };
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface DeviceContextType {
  devices: Device[];
  consumables: ConsumableInventory[];
  systemConfig: SystemConfig;
  stats: DeviceStats;
  syncStatus: SyncStatus;
  isOnline: boolean;
  lastSyncedAt: Date | null;
  addDevice: (newDevice: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  batchAddDevices: (devices: Array<Omit<Device, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  updateDevice: (id: string, updates: Partial<Device>, reason?: string) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  deleteMultipleDevices: (ids: string[]) => Promise<void>;
  batchUpdateStatus: (ids: string[], status: DeviceStatus, reason?: string) => Promise<void>;
  updateConsumableCount: (
    id: string,
    field: 'mouseWiredCount' | 'mouseWirelessCount' | 'earphoneCount' | 'mouseSpareCount' | 'earphoneSpareCount',
    delta: number
  ) => Promise<void>;
  updateConsumableMemo: (id: string, memo: string) => Promise<void>;
  updateSystemConfig: (updates: Partial<SystemConfig>) => Promise<void>;
  addClass: (grade: number, classNum: number, autoCreateChromebooks?: boolean) => Promise<void>;
  deleteClass: (grade: number, classNum: number) => Promise<void>;
  addGrade: (grade: number) => Promise<void>;
  deleteGrade: (grade: number) => Promise<void>;
  resetToDefaultData: () => Promise<void>;
  exportDataToJson: () => string;
  importDataFromJson: (jsonStr: string) => Promise<boolean>;
  syncDataNow: () => Promise<void>;
}

const STORAGE_KEYS = {
  DEVICES: 'school_devices_v1',
  CONSUMABLES: 'school_consumables_v1',
  CONFIG: 'school_config_v1',
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Helper function to remove undefined values for Firestore compatibility
function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Helper function to upload items in batches (Firestore max 500 ops per batch)
async function batchWriteDevices(deviceList: Device[]) {
  const CHUNK_SIZE = 350;
  for (let i = 0; i < deviceList.length; i += CHUNK_SIZE) {
    const chunk = deviceList.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const d of chunk) {
      const ref = doc(db, 'devices', d.id);
      batch.set(ref, cleanForFirestore(d), { merge: true });
    }
    await batch.commit();
  }
}

async function batchWriteConsumables(consList: ConsumableInventory[]) {
  const batch = writeBatch(db);
  for (const c of consList) {
    const ref = doc(db, 'consumables', c.id);
    batch.set(ref, cleanForFirestore(c), { merge: true });
  }
  await batch.commit();
}

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState<boolean>(false);

  // Local state initialized with clean cache or initial generators
  const [devices, setDevices] = useState<Device[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEVICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load devices from localStorage', e);
    }
    return generateInitialDevices();
  });

  const [consumables, setConsumables] = useState<ConsumableInventory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONSUMABLES);
      if (saved) {
        const parsed: ConsumableInventory[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load consumables from localStorage', e);
    }
    return generateInitialConsumables();
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SYSTEM_CONFIG,
          ...parsed,
          schoolName: parsed.schoolName || '제주초등학교',
        };
      }
    } catch (e) {
      console.error('Failed to load config from localStorage', e);
    }
    return INITIAL_SYSTEM_CONFIG;
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync to local storage for instant offline fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }
  }, [devices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONSUMABLES, JSON.stringify(consumables));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }
  }, [consumables]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(systemConfig));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }
  }, [systemConfig]);

  // Real-time Firestore Listeners
  useEffect(() => {
    let unsubscribeDevices: (() => void) | null = null;
    let unsubscribeConsumables: (() => void) | null = null;
    let unsubscribeConfig: (() => void) | null = null;

    const setupFirestoreListeners = async () => {
      try {
        setSyncStatus('syncing');

        // 1. Devices Listener
        const devicesCol = collection(db, 'devices');
        unsubscribeDevices = onSnapshot(
          devicesCol,
          async (snapshot) => {
            if (snapshot.empty) {
              // If remote Firestore is empty, seed initial devices
              console.log('Remote Firestore devices is empty. Seeding initial devices to Cloud...');
              const initialDevs = generateInitialDevices();
              setDevices(initialDevs);
              try {
                await batchWriteDevices(initialDevs);
              } catch (err) {
                console.error('Error seeding devices to Firestore:', err);
              }
            } else {
              const remoteDevices: Device[] = [];
              snapshot.forEach((docSnap) => {
                remoteDevices.push(docSnap.data() as Device);
              });
              setDevices(remoteDevices);
            }
            setLastSyncedAt(new Date());
            setSyncStatus('synced');
            setIsInitialLoadDone(true);
          },
          (error) => {
            console.error('Firestore devices listener error:', error);
            setSyncStatus('error');
          }
        );

        // 2. Consumables Listener
        const consumablesCol = collection(db, 'consumables');
        unsubscribeConsumables = onSnapshot(
          consumablesCol,
          async (snapshot) => {
            if (snapshot.empty) {
              console.log('Remote Firestore consumables is empty. Seeding initial consumables to Cloud...');
              const initialCons = generateInitialConsumables();
              setConsumables(initialCons);
              try {
                await batchWriteConsumables(initialCons);
              } catch (err) {
                console.error('Error seeding consumables to Firestore:', err);
              }
            } else {
              const remoteCons: ConsumableInventory[] = [];
              snapshot.forEach((docSnap) => {
                remoteCons.push(docSnap.data() as ConsumableInventory);
              });
              setConsumables(remoteCons);
            }
            setLastSyncedAt(new Date());
          },
          (error) => {
            console.error('Firestore consumables listener error:', error);
          }
        );

        // 3. System Config Listener
        const configDocRef = doc(db, 'systemConfig', 'main');
        unsubscribeConfig = onSnapshot(
          configDocRef,
          async (docSnap) => {
            if (!docSnap.exists()) {
              console.log('Remote Firestore systemConfig is empty. Seeding initial config to Cloud...');
              setSystemConfig(INITIAL_SYSTEM_CONFIG);
              try {
                await setDoc(configDocRef, cleanForFirestore(INITIAL_SYSTEM_CONFIG));
              } catch (err) {
                console.error('Error seeding config to Firestore:', err);
              }
            } else {
              setSystemConfig({
                ...INITIAL_SYSTEM_CONFIG,
                ...(docSnap.data() as SystemConfig),
              });
            }
            setLastSyncedAt(new Date());
          },
          (error) => {
            console.error('Firestore config listener error:', error);
          }
        );
      } catch (err) {
        console.error('Failed to setup Firestore listeners:', err);
        setSyncStatus('error');
      }
    };

    setupFirestoreListeners();

    return () => {
      if (unsubscribeDevices) unsubscribeDevices();
      if (unsubscribeConsumables) unsubscribeConsumables();
      if (unsubscribeConfig) unsubscribeConfig();
    };
  }, []);

  // Compute live statistics matching PRD expectations
  const stats = useMemo<DeviceStats>(() => {
    const cbList = devices.filter((d) => d.deviceType === 'chromebook');
    const cbTotal = cbList.length;
    const cbNormal = cbList.filter((d) => d.status === 'normal').length;
    const cbRepair = cbList.filter((d) => d.status === 'repair').length;
    const cbBroken = cbList.filter((d) => d.status === 'broken').length;

    const mfrMap: Record<string, { total: number; normal: number; repair: number; broken: number }> = {
      삼성전자: { total: 0, normal: 0, repair: 0, broken: 0 },
      LG: { total: 0, normal: 0, repair: 0, broken: 0 },
      레노버: { total: 0, normal: 0, repair: 0, broken: 0 },
      ASUS: { total: 0, normal: 0, repair: 0, broken: 0 },
    };

    cbList.forEach((d) => {
      let mfr = d.manufacturer || '기타';
      if (mfr === 'LG전자' || mfr === 'LG ELECTRONICS') {
        mfr = 'LG';
      }
      if (!mfrMap[mfr]) {
        mfrMap[mfr] = { total: 0, normal: 0, repair: 0, broken: 0 };
      }
      mfrMap[mfr].total++;
      if (d.status === 'normal') mfrMap[mfr].normal++;
      if (d.status === 'repair') mfrMap[mfr].repair++;
      if (d.status === 'broken') mfrMap[mfr].broken++;
    });

    const mouseWired = consumables.reduce((acc, c) => acc + (c.mouseWiredCount || 0), 0);
    const mouseWireless = consumables.reduce((acc, c) => acc + (c.mouseWirelessCount || 0), 0);
    const mouseSpare = consumables.reduce((acc, c) => acc + (c.mouseSpareCount || 0), 0);
    const mouseTotal = mouseWired + mouseWireless + mouseSpare;

    const earphoneAssigned = consumables.reduce((acc, c) => acc + (c.earphoneCount || 0), 0);
    const earphoneSpare = consumables.reduce((acc, c) => acc + (c.earphoneSpareCount || 0), 0);
    const earphoneTotal = earphoneAssigned + earphoneSpare;

    const totalAll = cbTotal + mouseTotal + earphoneTotal;
    const operationalRate = cbTotal > 0 ? (cbNormal / cbTotal) * 100 : 0;

    return {
      chromebook: {
        total: cbTotal,
        normal: cbNormal,
        repair: cbRepair,
        broken: cbBroken,
        operationalRate: Math.round(operationalRate * 10) / 10,
        byManufacturer: mfrMap,
      },
      mouse: {
        total: mouseTotal,
        wired: mouseWired,
        wireless: mouseWireless,
        spare: mouseSpare,
      },
      earphone: {
        total: earphoneTotal,
        assigned: earphoneAssigned,
        spare: earphoneSpare,
      },
      overall: {
        totalAllDevices: totalAll,
        totalNormal: cbNormal,
        totalRepair: cbRepair,
        totalBroken: cbBroken,
      },
    };
  }, [devices, consumables]);

  // Force re-sync with Firestore
  const syncDataNow = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const devDocs = await getDocs(collection(db, 'devices'));
      const consDocs = await getDocs(collection(db, 'consumables'));
      
      const remoteDevices: Device[] = [];
      devDocs.forEach((d) => remoteDevices.push(d.data() as Device));
      
      const remoteCons: ConsumableInventory[] = [];
      consDocs.forEach((c) => remoteCons.push(c.data() as ConsumableInventory));

      if (remoteDevices.length > 0) setDevices(remoteDevices);
      if (remoteCons.length > 0) setConsumables(remoteCons);

      setLastSyncedAt(new Date());
      setSyncStatus('synced');
    } catch (e) {
      console.error('Manual sync error:', e);
      setSyncStatus('error');
    }
  }, []);

  // CRUD Methods connected to Firestore

  const addDevice = async (newDeviceData: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    const loc = newDeviceData.location || '스마트실';
    const locMatch = loc.match(/(\d+)학년\s*(\d+)반/);
    let grade = newDeviceData.grade;
    let classNum = newDeviceData.classNum;
    if (locMatch) {
      if (!grade) grade = parseInt(locMatch[1], 10);
      if (!classNum) classNum = parseInt(locMatch[2], 10);
    }

    let cDevNum = newDeviceData.classDeviceNumber;
    if (cDevNum === undefined || cDevNum === null) {
      const existingInLoc = devices.filter((d) => d.location === loc && d.classDeviceNumber !== undefined);
      const maxNum = existingInLoc.length > 0 ? Math.max(...existingInLoc.map((d) => d.classDeviceNumber || 0)) : 0;
      cDevNum = maxNum + 1;
    }

    const newDevice: Device = {
      ...newDeviceData,
      location: loc,
      grade,
      classNum,
      classDeviceNumber: cDevNum,
      id: `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: `hist-${Date.now()}`,
          date: now,
          previousStatus: newDeviceData.status,
          newStatus: newDeviceData.status,
          description: '신규 기기 등록 완료',
          userName: systemConfig.digitalTutorName,
        },
      ],
    };

    // Optimistic local update
    setDevices((prev) => [newDevice, ...prev]);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'devices', newDevice.id), cleanForFirestore(newDevice));
    } catch (e) {
      console.error('Firestore save device error:', e);
    }

    // Auto-register class if needed
    if (grade && classNum) {
      const currentGrades = systemConfig.customGrades ? [...systemConfig.customGrades] : [3, 4, 5, 6];
      const nextGrades = currentGrades.includes(grade) ? currentGrades : [...currentGrades, grade].sort((a, b) => a - b);
      const currentClasses: Record<number, number[]> = { ...(systemConfig.customClasses || {}) };
      const gradeClasses = currentClasses[grade] ? [...currentClasses[grade]] : [];
      if (!gradeClasses.includes(classNum)) {
        gradeClasses.push(classNum);
        gradeClasses.sort((a, b) => a - b);
      }
      currentClasses[grade] = gradeClasses;

      const updatedConfig: SystemConfig = {
        ...systemConfig,
        customGrades: nextGrades,
        customClasses: currentClasses,
      };

      setSystemConfig(updatedConfig);
      try {
        await setDoc(doc(db, 'systemConfig', 'main'), cleanForFirestore(updatedConfig));
      } catch (err) {
        console.error('Firestore config update error:', err);
      }

      if (!consumables.some((c) => c.location === loc)) {
        const newCons: ConsumableInventory = {
          id: `cons-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          location: loc,
          deviceType: 'mouse',
          mouseWiredCount: 0,
          mouseWirelessCount: 20,
          earphoneCount: 15,
          mouseSpareCount: 0,
          earphoneSpareCount: 0,
          requestMemo: '',
          updatedAt: now,
        };
        setConsumables((prev) => [...prev, newCons]);
        try {
          await setDoc(doc(db, 'consumables', newCons.id), cleanForFirestore(newCons));
        } catch (err) {
          console.error('Firestore consumable create error:', err);
        }
      }
    }
  };

  const batchAddDevices = async (newDevicesData: Array<Omit<Device, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const now = new Date().toISOString().split('T')[0];
    const generated: Device[] = newDevicesData.map((data, idx) => {
      const loc = data.location || '스마트실';
      const locMatch = loc.match(/(\d+)학년\s*(\d+)반/);
      let grade = data.grade;
      let classNum = data.classNum;
      if (locMatch) {
        if (!grade) grade = parseInt(locMatch[1], 10);
        if (!classNum) classNum = parseInt(locMatch[2], 10);
      }

      return {
        ...data,
        location: loc,
        grade,
        classNum,
        id: `device-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: now,
        updatedAt: now,
        history: [
          {
            id: `hist-${Date.now()}-${idx}`,
            date: now,
            previousStatus: data.status,
            newStatus: data.status,
            description: '일괄 기기 등록 완료',
            userName: systemConfig.digitalTutorName,
          },
        ],
      };
    });

    setDevices((prev) => [...generated, ...prev]);

    try {
      await batchWriteDevices(generated);
    } catch (e) {
      console.error('Firestore batchAdd error:', e);
    }
  };

  const updateDevice = async (id: string, updates: Partial<Device>, reason?: string) => {
    const now = new Date().toISOString().split('T')[0];
    let updatedTargetDevice: Device | null = null;

    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const previousStatus = d.status;
        const newStatus = updates.status || d.status;
        const hasStatusChanged = updates.status && updates.status !== previousStatus;

        const newHistory = [...(d.history || [])];
        if (hasStatusChanged || reason) {
          newHistory.unshift({
            id: `hist-${Date.now()}`,
            date: now,
            previousStatus,
            newStatus,
            description: reason || updates.issueDescription || updates.repairDescription || '기기 정보 및 상태 수정',
            userName: systemConfig.digitalTutorName,
          });
        }

        const updated: Device = {
          ...d,
          ...updates,
          updatedAt: now,
          history: newHistory,
        };
        updatedTargetDevice = updated;
        return updated;
      })
    );

    if (updatedTargetDevice) {
      try {
        await setDoc(doc(db, 'devices', id), cleanForFirestore(updatedTargetDevice), { merge: true });
      } catch (e) {
        console.error('Firestore updateDevice error:', e);
      }
    }
  };

  const deleteDevice = async (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteDoc(doc(db, 'devices', id));
    } catch (e) {
      console.error('Firestore deleteDevice error:', e);
    }
  };

  const deleteMultipleDevices = async (ids: string[]) => {
    const idSet = new Set(ids);
    setDevices((prev) => prev.filter((d) => !idSet.has(d.id)));

    try {
      const CHUNK = 300;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const slice = ids.slice(i, i + CHUNK);
        const batch = writeBatch(db);
        for (const id of slice) {
          batch.delete(doc(db, 'devices', id));
        }
        await batch.commit();
      }
    } catch (e) {
      console.error('Firestore deleteMultipleDevices error:', e);
    }
  };

  const batchUpdateStatus = async (ids: string[], status: DeviceStatus, reason?: string) => {
    const now = new Date().toISOString().split('T')[0];
    const idSet = new Set(ids);
    const updatedDevices: Device[] = [];

    setDevices((prev) =>
      prev.map((d) => {
        if (!idSet.has(d.id)) return d;
        const newHistory = [...(d.history || [])];
        newHistory.unshift({
          id: `hist-${Date.now()}-${d.id}`,
          date: now,
          previousStatus: d.status,
          newStatus: status,
          description: reason || `일괄 상태 변경 (${status})`,
          userName: systemConfig.digitalTutorName,
        });

        const updated: Device = {
          ...d,
          status,
          issueDescription: status === 'broken' ? reason || d.issueDescription : d.issueDescription,
          repairDescription:
            status === 'repair'
              ? reason || d.repairDescription
              : status === 'normal'
              ? '수리 완료 조치'
              : d.repairDescription,
          updatedAt: now,
          history: newHistory,
        };
        updatedDevices.push(updated);
        return updated;
      })
    );

    try {
      await batchWriteDevices(updatedDevices);
    } catch (e) {
      console.error('Firestore batchUpdateStatus error:', e);
    }
  };

  const updateConsumableCount = async (
    id: string,
    field: 'mouseWiredCount' | 'mouseWirelessCount' | 'earphoneCount' | 'mouseSpareCount' | 'earphoneSpareCount',
    delta: number
  ) => {
    const now = new Date().toISOString().split('T')[0];
    let targetCons: ConsumableInventory | null = null;

    setConsumables((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const currentVal = c[field] || 0;
        const newVal = Math.max(0, currentVal + delta);
        const updated: ConsumableInventory = {
          ...c,
          [field]: newVal,
          updatedAt: now,
        };
        targetCons = updated;
        return updated;
      })
    );

    if (targetCons) {
      try {
        await setDoc(doc(db, 'consumables', id), cleanForFirestore(targetCons), { merge: true });
      } catch (e) {
        console.error('Firestore updateConsumableCount error:', e);
      }
    }
  };

  const updateConsumableMemo = async (id: string, memo: string) => {
    const now = new Date().toISOString().split('T')[0];
    let targetCons: ConsumableInventory | null = null;

    setConsumables((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated: ConsumableInventory = { ...c, requestMemo: memo, updatedAt: now };
        targetCons = updated;
        return updated;
      })
    );

    if (targetCons) {
      try {
        await setDoc(doc(db, 'consumables', id), cleanForFirestore(targetCons), { merge: true });
      } catch (e) {
        console.error('Firestore updateConsumableMemo error:', e);
      }
    }
  };

  const updateSystemConfig = async (updates: Partial<SystemConfig>) => {
    const updated: SystemConfig = { ...systemConfig, ...updates };
    setSystemConfig(updated);
    try {
      await setDoc(doc(db, 'systemConfig', 'main'), cleanForFirestore(updated), { merge: true });
    } catch (e) {
      console.error('Firestore updateSystemConfig error:', e);
    }
  };

  const addClass = async (grade: number, classNum: number, autoCreateChromebooks = true) => {
    const locName = `${grade}학년 ${classNum}반`;
    const now = new Date().toISOString().split('T')[0];

    const currentGrades = systemConfig.customGrades && systemConfig.customGrades.length > 0
      ? [...systemConfig.customGrades]
      : [3, 4, 5, 6];
    const nextGrades = currentGrades.includes(grade)
      ? currentGrades
      : [...currentGrades, grade].sort((a, b) => a - b);

    const currentClasses: Record<number, number[]> = {
      ...(systemConfig.customClasses || {
        3: [1, 2, 3, 4, 5],
        4: [1, 2, 3, 4, 5, 6],
        5: [1, 2, 3, 4, 5, 6],
        6: [1, 2, 3, 4, 5, 6],
      }),
    };
    const gradeClasses = currentClasses[grade] ? currentClasses[grade].filter((c) => c !== classNum) : [];
    if (!gradeClasses.includes(classNum)) {
      gradeClasses.push(classNum);
      gradeClasses.sort((a, b) => a - b);
    }
    currentClasses[grade] = gradeClasses;

    const newConfig: SystemConfig = {
      ...systemConfig,
      customGrades: nextGrades,
      customClasses: currentClasses,
    };
    setSystemConfig(newConfig);

    const newCons: ConsumableInventory = {
      id: `cons-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      location: locName,
      deviceType: 'mouse',
      mouseWiredCount: 0,
      mouseWirelessCount: 20,
      earphoneCount: 20,
      mouseSpareCount: 0,
      earphoneSpareCount: 0,
      requestMemo: '',
      updatedAt: now,
    };
    setConsumables((prev) => {
      if (prev.some((c) => c.location === locName)) return prev;
      return [...prev, newCons];
    });

    const newDevs: Device[] = [];
    if (autoCreateChromebooks) {
      for (let i = 1; i <= 20; i++) {
        newDevs.push({
          id: `device-cb-${grade}-${classNum}-${i}-${Date.now()}`,
          deviceType: 'chromebook',
          managementNumber: '',
          classDeviceNumber: i,
          deviceName: '삼성 갤럭시 크롬북',
          modelName: '',
          manufacturer: '삼성전자',
          location: locName,
          grade,
          classNum,
          status: 'normal',
          createdAt: now,
          updatedAt: now,
          note: `학생 배정용 (${locName} ${i}번)`,
          history: [],
        });
      }
      setDevices((prev) => [...prev, ...newDevs]);
    }

    try {
      await setDoc(doc(db, 'systemConfig', 'main'), cleanForFirestore(newConfig), { merge: true });
      await setDoc(doc(db, 'consumables', newCons.id), cleanForFirestore(newCons), { merge: true });
      if (newDevs.length > 0) {
        await batchWriteDevices(newDevs);
      }
    } catch (e) {
      console.error('Firestore addClass error:', e);
    }
  };

  const deleteClass = async (grade: number, classNum: number) => {
    const locName = `${grade}학년 ${classNum}반`;

    const devsToDelete = devices.filter((d) => d.location === locName || (d.grade === grade && d.classNum === classNum));
    const consToDelete = consumables.filter((c) => c.location === locName);

    setDevices((prev) => prev.filter((d) => d.location !== locName && !(d.grade === grade && d.classNum === classNum)));
    setConsumables((prev) => prev.filter((c) => c.location !== locName));

    const currentClasses: Record<number, number[]> = {
      ...(systemConfig.customClasses || {
        3: [1, 2, 3, 4, 5],
        4: [1, 2, 3, 4, 5, 6],
        5: [1, 2, 3, 4, 5, 6],
        6: [1, 2, 3, 4, 5, 6],
      }),
    };
    const gradeClasses = currentClasses[grade] ? currentClasses[grade].filter((c) => c !== classNum) : [];
    currentClasses[grade] = gradeClasses;

    const newConfig: SystemConfig = {
      ...systemConfig,
      customClasses: currentClasses,
    };
    setSystemConfig(newConfig);

    try {
      await setDoc(doc(db, 'systemConfig', 'main'), cleanForFirestore(newConfig), { merge: true });
      for (const d of devsToDelete) {
        await deleteDoc(doc(db, 'devices', d.id));
      }
      for (const c of consToDelete) {
        await deleteDoc(doc(db, 'consumables', c.id));
      }
    } catch (e) {
      console.error('Firestore deleteClass error:', e);
    }
  };

  const addGrade = async (grade: number) => {
    const locName = `${grade}학년 1반`;
    const now = new Date().toISOString().split('T')[0];

    const currentGrades = systemConfig.customGrades && systemConfig.customGrades.length > 0
      ? [...systemConfig.customGrades]
      : [3, 4, 5, 6];
    const nextGrades = currentGrades.includes(grade)
      ? currentGrades
      : [...currentGrades, grade].sort((a, b) => a - b);

    const currentClasses: Record<number, number[]> = {
      ...(systemConfig.customClasses || {
        3: [1, 2, 3, 4, 5],
        4: [1, 2, 3, 4, 5, 6],
        5: [1, 2, 3, 4, 5, 6],
        6: [1, 2, 3, 4, 5, 6],
      }),
    };
    if (!currentClasses[grade] || currentClasses[grade].length === 0) {
      currentClasses[grade] = [1];
    }

    const newConfig: SystemConfig = {
      ...systemConfig,
      customGrades: nextGrades,
      customClasses: currentClasses,
    };
    setSystemConfig(newConfig);

    const newCons: ConsumableInventory = {
      id: `cons-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      location: locName,
      deviceType: 'mouse',
      mouseWiredCount: 0,
      mouseWirelessCount: 20,
      earphoneCount: 20,
      mouseSpareCount: 0,
      earphoneSpareCount: 0,
      requestMemo: '',
      updatedAt: now,
    };
    setConsumables((prev) => {
      if (prev.some((c) => c.location === locName)) return prev;
      return [...prev, newCons];
    });

    const newDevs: Device[] = [];
    for (let i = 1; i <= 20; i++) {
      newDevs.push({
        id: `device-cb-${grade}-1-${i}-${Date.now()}`,
        deviceType: 'chromebook',
        managementNumber: '',
        classDeviceNumber: i,
        deviceName: '삼성 갤럭시 크롬북',
        modelName: '',
        manufacturer: '삼성전자',
        location: locName,
        grade,
        classNum: 1,
        status: 'normal',
        createdAt: now,
        updatedAt: now,
        note: `학생 배정용 (${locName} ${i}번)`,
        history: [],
      });
    }
    setDevices((prev) => [...prev, ...newDevs]);

    try {
      await setDoc(doc(db, 'systemConfig', 'main'), cleanForFirestore(newConfig), { merge: true });
      await setDoc(doc(db, 'consumables', newCons.id), cleanForFirestore(newCons), { merge: true });
      await batchWriteDevices(newDevs);
    } catch (e) {
      console.error('Firestore addGrade error:', e);
    }
  };

  const deleteGrade = async (grade: number) => {
    const devsToDelete = devices.filter((d) => d.grade === grade || d.location.startsWith(`${grade}학년`));
    const consToDelete = consumables.filter((c) => c.location.startsWith(`${grade}학년`));

    setDevices((prev) => prev.filter((d) => d.grade !== grade && !d.location.startsWith(`${grade}학년`)));
    setConsumables((prev) => prev.filter((c) => !c.location.startsWith(`${grade}학년`)));

    const currentGrades = systemConfig.customGrades && systemConfig.customGrades.length > 0
      ? [...systemConfig.customGrades]
      : [3, 4, 5, 6];
    const nextGrades = currentGrades.filter((g) => g !== grade);
    const currentClasses: Record<number, number[]> = {
      ...(systemConfig.customClasses || {
        3: [1, 2, 3, 4, 5],
        4: [1, 2, 3, 4, 5, 6],
        5: [1, 2, 3, 4, 5, 6],
        6: [1, 2, 3, 4, 5, 6],
      }),
    };
    delete currentClasses[grade];

    const newConfig: SystemConfig = {
      ...systemConfig,
      customGrades: nextGrades,
      customClasses: currentClasses,
    };
    setSystemConfig(newConfig);

    try {
      await setDoc(doc(db, 'systemConfig', 'main'), cleanForFirestore(newConfig), { merge: true });
      for (const d of devsToDelete) {
        await deleteDoc(doc(db, 'devices', d.id));
      }
      for (const c of consToDelete) {
        await deleteDoc(doc(db, 'consumables', c.id));
      }
    } catch (e) {
      console.error('Firestore deleteGrade error:', e);
    }
  };

  const resetToDefaultData = async () => {
    const defaultDevs = generateInitialDevices();
    const defaultCons = generateInitialConsumables();
    setDevices(defaultDevs);
    setConsumables(defaultCons);
    setSystemConfig(INITIAL_SYSTEM_CONFIG);

    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(defaultDevs));
    localStorage.setItem(STORAGE_KEYS.CONSUMABLES, JSON.stringify(defaultCons));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_SYSTEM_CONFIG));

    try {
      setSyncStatus('syncing');
      await setDoc(doc(db, 'systemConfig', 'main'), cleanForFirestore(INITIAL_SYSTEM_CONFIG));
      await batchWriteDevices(defaultDevs);
      await batchWriteConsumables(defaultCons);
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (e) {
      console.error('Firestore reset error:', e);
      setSyncStatus('error');
    }
  };

  const exportDataToJson = () => {
    return JSON.stringify(
      {
        devices,
        consumables,
        systemConfig,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  };

  const importDataFromJson = async (jsonStr: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.devices)) {
        setDevices(data.devices);
        await batchWriteDevices(data.devices);
      }
      if (Array.isArray(data.consumables)) {
        setConsumables(data.consumables);
        await batchWriteConsumables(data.consumables);
      }
      if (data.systemConfig) {
        setSystemConfig(data.systemConfig);
        await setDoc(doc(db, 'systemConfig', 'main'), cleanForFirestore(data.systemConfig));
      }
      setLastSyncedAt(new Date());
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  return (
    <DeviceContext.Provider
      value={{
        devices,
        consumables,
        systemConfig,
        stats,
        syncStatus,
        isOnline,
        lastSyncedAt,
        addDevice,
        batchAddDevices,
        updateDevice,
        deleteDevice,
        deleteMultipleDevices,
        batchUpdateStatus,
        updateConsumableCount,
        updateConsumableMemo,
        updateSystemConfig,
        addClass,
        deleteClass,
        addGrade,
        deleteGrade,
        resetToDefaultData,
        exportDataToJson,
        importDataFromJson,
        syncDataNow,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevices = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
};
