import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Device, ConsumableInventory, SystemConfig, DeviceStatus, Manufacturer } from '../types';
import { generateInitialDevices, generateInitialConsumables, INITIAL_SYSTEM_CONFIG } from '../data/initialData';

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

interface DeviceContextType {
  devices: Device[];
  consumables: ConsumableInventory[];
  systemConfig: SystemConfig;
  stats: DeviceStats;
  addDevice: (newDevice: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => void;
  batchAddDevices: (devices: Array<Omit<Device, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  updateDevice: (id: string, updates: Partial<Device>, reason?: string) => void;
  deleteDevice: (id: string) => void;
  deleteMultipleDevices: (ids: string[]) => void;
  batchUpdateStatus: (ids: string[], status: DeviceStatus, reason?: string) => void;
  updateConsumableCount: (
    id: string,
    field: 'mouseWiredCount' | 'mouseWirelessCount' | 'earphoneCount' | 'mouseSpareCount' | 'earphoneSpareCount',
    delta: number
  ) => void;
  updateConsumableMemo: (id: string, memo: string) => void;
  updateSystemConfig: (updates: Partial<SystemConfig>) => void;
  addClass: (grade: number, classNum: number, autoCreateChromebooks?: boolean) => void;
  deleteClass: (grade: number, classNum: number) => void;
  addGrade: (grade: number) => void;
  deleteGrade: (grade: number) => void;
  resetToDefaultData: () => void;
  exportDataToJson: () => string;
  importDataFromJson: (jsonStr: string) => boolean;
}

const STORAGE_KEYS = {
  DEVICES: 'school_devices_v1',
  CONSUMABLES: 'school_consumables_v1',
  CONFIG: 'school_config_v1',
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEVICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out 1학년 and 2학년 devices per user's requirement (3학년 1반부터 시작)
          const validDevices = parsed.filter((d: any) => {
            if (!d.location) return true;
            if (d.location.startsWith('1학년') || d.location.startsWith('2학년')) return false;
            if (d.grade === 1 || d.grade === 2) return false;
            return true;
          });

          if (validDevices.length > 0) {
            // Track device count per location to assign classDeviceNumber if missing
            const locationCounts: Record<string, number> = {};

            return validDevices.map((d: any) => {
              let classNum = d.classDeviceNumber;
              let mgmt = d.managementNumber || '';

              // Cleanly migrate legacy special room locations to '스마트실'
              let location = d.location || '스마트실';
              if (
                location.includes('컴퓨터') || 
                location.includes('AI 스마트') || 
                location.includes('보관실') || 
                location === '특별실'
              ) {
                location = '스마트실';
              }

              // Auto extract grade & classNum if not set
              let grade = d.grade;
              let cNum = d.classNum;
              const locMatch = location.match(/(\d+)학년\s*(\d+)반/);
              if (locMatch) {
                if (!grade) grade = parseInt(locMatch[1], 10);
                if (!cNum) cNum = parseInt(locMatch[2], 10);
              }

              locationCounts[location] = (locationCounts[location] || 0) + 1;

              // If classDeviceNumber is undefined/null, infer from note, id, mgmt, or count
              if (classNum === undefined || classNum === null) {
                const noteMatch = typeof d.note === 'string' ? d.note.match(/(\d+)번/) : null;
                const idMatch = typeof d.id === 'string' ? d.id.match(/-(\d+)$/) : null;
                const mgmtMatch = typeof mgmt === 'string' ? mgmt.match(/^(\d+)번$/) || mgmt.match(/(\d+)번/) : null;

                if (noteMatch) {
                  classNum = parseInt(noteMatch[1], 10);
                } else if (idMatch) {
                  classNum = parseInt(idMatch[1], 10);
                } else if (mgmtMatch) {
                  classNum = parseInt(mgmtMatch[1], 10);
                } else {
                  classNum = locationCounts[location];
                }
              }

              if (typeof mgmt === 'string' && mgmt.match(/^(\d+)번$/)) {
                mgmt = '';
              }

              return {
                ...d,
                location,
                grade,
                classNum: cNum,
                classDeviceNumber: classNum,
                managementNumber: mgmt,
              };
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to load devices from storage', e);
    }
    return generateInitialDevices();
  });

  const [consumables, setConsumables] = useState<ConsumableInventory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONSUMABLES);
      if (saved) {
        const parsed: ConsumableInventory[] = JSON.parse(saved);
        const filtered = parsed.filter(c => !c.location.startsWith('1학년') && !c.location.startsWith('2학년'));
        if (filtered.length > 0) {
          let hasSmart = filtered.some(c => c.location === '스마트실');
          if (!hasSmart) {
            const legacySpecial = filtered.find(c => c.location === '제1컴퓨터실' || c.location.includes('컴퓨터') || c.location.includes('스마트'));
            if (legacySpecial) {
              legacySpecial.location = '스마트실';
            }
          }
          return filtered;
        }
      }
    } catch (e) {
      console.error('Failed to load consumables from storage', e);
    }
    return generateInitialConsumables();
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schoolName === '제주이도초등학교') {
          parsed.schoolName = '제주초등학교';
        }
        let customGrades = parsed.customGrades;
        if (Array.isArray(customGrades)) {
          customGrades = customGrades.filter((g: number) => g >= 3);
          if (customGrades.length === 0) customGrades = [3, 4, 5, 6];
        } else {
          customGrades = [3, 4, 5, 6];
        }

        const customClasses = { ...(parsed.customClasses || {}) };
        delete customClasses[1];
        delete customClasses[2];
        if (!customClasses[3]) customClasses[3] = [1, 2, 3, 4, 5];
        if (!customClasses[4]) customClasses[4] = [1, 2, 3, 4, 5, 6];
        if (!customClasses[5]) customClasses[5] = [1, 2, 3, 4, 5, 6];
        if (!customClasses[6]) customClasses[6] = [1, 2, 3, 4, 5, 6];

        return { 
          ...INITIAL_SYSTEM_CONFIG, 
          ...parsed, 
          customGrades,
          customClasses,
          schoolName: parsed.schoolName || '제주초등학교' 
        };
      }
    } catch (e) {
      console.error('Failed to load config from storage', e);
    }
    return INITIAL_SYSTEM_CONFIG;
  });

  // Save to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
    } catch (e) {
      console.error('Failed to save devices', e);
    }
  }, [devices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONSUMABLES, JSON.stringify(consumables));
    } catch (e) {
      console.error('Failed to save consumables', e);
    }
  }, [consumables]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(systemConfig));
    } catch (e) {
      console.error('Failed to save config', e);
    }
  }, [systemConfig]);

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

  const addDevice = (newDeviceData: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    const loc = newDeviceData.location || '스마트실';
    const locMatch = loc.match(/(\d+)학년\s*(\d+)반/);
    let grade = newDeviceData.grade;
    let classNum = newDeviceData.classNum;
    if (locMatch) {
      if (!grade) grade = parseInt(locMatch[1], 10);
      if (!classNum) classNum = parseInt(locMatch[2], 10);
    }

    // Determine classDeviceNumber if not specified
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

    setDevices((prev) => [newDevice, ...prev]);

    // If this device belongs to a grade & class that isn't registered yet, auto-register in systemConfig & consumables
    if (grade && classNum) {
      setSystemConfig((prev) => {
        const currentGrades = prev.customGrades ? [...prev.customGrades] : [3, 4, 5, 6];
        const nextGrades = currentGrades.includes(grade!) ? currentGrades : [...currentGrades, grade!].sort((a, b) => a - b);
        const currentClasses: Record<number, number[]> = { ...(prev.customClasses || {}) };
        const gradeClasses = currentClasses[grade!] ? [...currentClasses[grade!]] : [];
        if (!gradeClasses.includes(classNum!)) {
          gradeClasses.push(classNum!);
          gradeClasses.sort((a, b) => a - b);
        }
        currentClasses[grade!] = gradeClasses;
        return {
          ...prev,
          customGrades: nextGrades,
          customClasses: currentClasses,
        };
      });

      setConsumables((prev) => {
        if (prev.some((c) => c.location === loc)) return prev;
        return [
          ...prev,
          {
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
          },
        ];
      });
    }
  };

  const batchAddDevices = (newDevicesData: Array<Omit<Device, 'id' | 'createdAt' | 'updatedAt'>>) => {
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
  };

  const updateDevice = (id: string, updates: Partial<Device>, reason?: string) => {
    const now = new Date().toISOString().split('T')[0];
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

        return {
          ...d,
          ...updates,
          updatedAt: now,
          history: newHistory,
        };
      })
    );
  };

  const deleteDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  const deleteMultipleDevices = (ids: string[]) => {
    const idSet = new Set(ids);
    setDevices((prev) => prev.filter((d) => !idSet.has(d.id)));
  };

  const batchUpdateStatus = (ids: string[], status: DeviceStatus, reason?: string) => {
    const now = new Date().toISOString().split('T')[0];
    const idSet = new Set(ids);
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

        return {
          ...d,
          status,
          issueDescription: status === 'broken' ? reason || d.issueDescription : d.issueDescription,
          repairDescription: status === 'repair' ? reason || d.repairDescription : status === 'normal' ? '수리 완료 조치' : d.repairDescription,
          updatedAt: now,
          history: newHistory,
        };
      })
    );
  };

  const updateConsumableCount = (
    id: string,
    field: 'mouseWiredCount' | 'mouseWirelessCount' | 'earphoneCount' | 'mouseSpareCount' | 'earphoneSpareCount',
    delta: number
  ) => {
    const now = new Date().toISOString().split('T')[0];
    setConsumables((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const currentVal = c[field] || 0;
        const newVal = Math.max(0, currentVal + delta);
        return {
          ...c,
          [field]: newVal,
          updatedAt: now,
        };
      })
    );
  };

  const updateConsumableMemo = (id: string, memo: string) => {
    const now = new Date().toISOString().split('T')[0];
    setConsumables((prev) =>
      prev.map((c) => (c.id === id ? { ...c, requestMemo: memo, updatedAt: now } : c))
    );
  };

  const updateSystemConfig = (updates: Partial<SystemConfig>) => {
    setSystemConfig((prev) => ({ ...prev, ...updates }));
  };

  const addClass = (grade: number, classNum: number, autoCreateChromebooks = true) => {
    const locName = `${grade}학년 ${classNum}반`;
    const now = new Date().toISOString().split('T')[0];

    // 1. Update system config classes
    setSystemConfig((prev) => {
      const currentGrades = prev.customGrades && prev.customGrades.length > 0
        ? [...prev.customGrades]
        : [3, 4, 5, 6];
      const nextGrades = currentGrades.includes(grade)
        ? currentGrades
        : [...currentGrades, grade].sort((a, b) => a - b);

      const currentClasses: Record<number, number[]> = {
        ...(prev.customClasses || {
          3: [1, 2, 3, 4, 5],
          4: [1, 2, 3, 4, 5, 6],
          5: [1, 2, 3, 4, 5, 6],
          6: [1, 2, 3, 4, 5, 6],
        }),
      };
      const gradeClasses = currentClasses[grade] ? [...currentClasses[grade]] : [];
      if (!gradeClasses.includes(classNum)) {
        gradeClasses.push(classNum);
        gradeClasses.sort((a, b) => a - b);
      }
      currentClasses[grade] = gradeClasses;

      return {
        ...prev,
        customGrades: nextGrades,
        customClasses: currentClasses,
      };
    });

    // 2. Add consumable record if not present
    setConsumables((prev) => {
      if (prev.some((c) => c.location === locName)) return prev;
      return [
        ...prev,
        {
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
        },
      ];
    });

    // 3. Auto-generate 1~20 Chromebooks if requested
    if (autoCreateChromebooks) {
      const newDevs: Device[] = [];
      for (let i = 1; i <= 20; i++) {
        newDevs.push({
          id: `device-cb-${grade}-${classNum}-${i}-${Date.now()}`,
          deviceType: 'chromebook',
          managementNumber: '', // 관리번호는 빈칸으로 추후 입력
          classDeviceNumber: i, // 반 번호 (1번 ~ 20번)
          deviceName: '삼성 갤럭시 크롬북',
          modelName: 'Galaxy Chromebook 2 360',
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
  };

  const deleteClass = (grade: number, classNum: number) => {
    const locName = `${grade}학년 ${classNum}반`;

    // 1. Remove devices in this class
    setDevices((prev) => prev.filter((d) => d.location !== locName && !(d.grade === grade && d.classNum === classNum)));

    // 2. Remove consumables for this class
    setConsumables((prev) => prev.filter((c) => c.location !== locName));

    // 3. Update config
    setSystemConfig((prev) => {
      const currentClasses: Record<number, number[]> = {
        ...(prev.customClasses || {
          3: [1, 2, 3, 4, 5],
          4: [1, 2, 3, 4, 5, 6],
          5: [1, 2, 3, 4, 5, 6],
          6: [1, 2, 3, 4, 5, 6],
        }),
      };
      const gradeClasses = currentClasses[grade] ? currentClasses[grade].filter((c) => c !== classNum) : [];
      currentClasses[grade] = gradeClasses;

      return {
        ...prev,
        customClasses: currentClasses,
      };
    });
  };

  const addGrade = (grade: number) => {
    const locName = `${grade}학년 1반`;
    const now = new Date().toISOString().split('T')[0];

    // 1. Atomically update system config with the new grade and its 1반
    setSystemConfig((prev) => {
      const currentGrades = prev.customGrades && prev.customGrades.length > 0
        ? [...prev.customGrades]
        : [3, 4, 5, 6];
      const nextGrades = currentGrades.includes(grade)
        ? currentGrades
        : [...currentGrades, grade].sort((a, b) => a - b);

      const currentClasses: Record<number, number[]> = {
        ...(prev.customClasses || {
          3: [1, 2, 3, 4, 5],
          4: [1, 2, 3, 4, 5, 6],
          5: [1, 2, 3, 4, 5, 6],
          6: [1, 2, 3, 4, 5, 6],
        }),
      };
      if (!currentClasses[grade] || currentClasses[grade].length === 0) {
        currentClasses[grade] = [1];
      }

      return {
        ...prev,
        customGrades: nextGrades,
        customClasses: currentClasses,
      };
    });

    // 2. Add consumable record for 1반
    setConsumables((prev) => {
      if (prev.some((c) => c.location === locName)) return prev;
      return [
        ...prev,
        {
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
        },
      ];
    });

    // 3. Auto-generate 1~20 Chromebooks for the new grade's 1반
    const newDevs: Device[] = [];
    for (let i = 1; i <= 20; i++) {
      newDevs.push({
        id: `device-cb-${grade}-1-${i}-${Date.now()}`,
        deviceType: 'chromebook',
        managementNumber: '',
        classDeviceNumber: i,
        deviceName: '삼성 갤럭시 크롬북',
        modelName: 'Galaxy Chromebook 2 360',
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
  };

  const deleteGrade = (grade: number) => {
    // 1. Remove devices in this grade
    setDevices((prev) => prev.filter((d) => d.grade !== grade && !d.location.startsWith(`${grade}학년`)));

    // 2. Remove consumables for this grade
    setConsumables((prev) => prev.filter((c) => !c.location.startsWith(`${grade}학년`)));

    // 3. Update config
    setSystemConfig((prev) => {
      const currentGrades = prev.customGrades && prev.customGrades.length > 0
        ? [...prev.customGrades]
        : [3, 4, 5, 6];
      const nextGrades = currentGrades.filter((g) => g !== grade);
      const currentClasses: Record<number, number[]> = {
        ...(prev.customClasses || {
          3: [1, 2, 3, 4, 5],
          4: [1, 2, 3, 4, 5, 6],
          5: [1, 2, 3, 4, 5, 6],
          6: [1, 2, 3, 4, 5, 6],
        }),
      };
      delete currentClasses[grade];

      return {
        ...prev,
        customGrades: nextGrades,
        customClasses: currentClasses,
      };
    });
  };

  const resetToDefaultData = () => {
    const defaultDevs = generateInitialDevices();
    const defaultCons = generateInitialConsumables();
    setDevices(defaultDevs);
    setConsumables(defaultCons);
    setSystemConfig(INITIAL_SYSTEM_CONFIG);
    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(defaultDevs));
    localStorage.setItem(STORAGE_KEYS.CONSUMABLES, JSON.stringify(defaultCons));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_SYSTEM_CONFIG));
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

  const importDataFromJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.devices)) {
        setDevices(data.devices);
      }
      if (Array.isArray(data.consumables)) {
        setConsumables(data.consumables);
      }
      if (data.systemConfig) {
        setSystemConfig(data.systemConfig);
      }
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
