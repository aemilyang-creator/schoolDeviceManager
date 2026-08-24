import React, { useState, useMemo } from 'react';
import { 
  School, 
  Laptop, 
  Mouse, 
  Headphones, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Edit3, 
  Save, 
  MessageSquare,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Trash2,
  PlusCircle,
  FolderPlus,
  Layers,
  CheckSquare,
  Square,
  AlertCircle,
  Check,
  Wrench
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { Device, DeviceType, DeviceStatus } from '../types';
import { getStatusBadgeStyle } from '../utils/formatters';

interface ClassroomViewProps {
  onSelectDevice: (device: Device) => void;
  onOpenRegisterModalForLocation?: (location: string) => void;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({ onSelectDevice, onOpenRegisterModalForLocation }) => {
  const { 
    devices, 
    consumables, 
    systemConfig,
    updateConsumableCount, 
    updateConsumableMemo, 
    updateDevice,
    deleteDevice,
    deleteMultipleDevices,
    addDevice,
    addClass,
    deleteClass,
    addGrade,
    deleteGrade
  } = useDevices();

  // Active grades and classes from systemConfig or dynamic discovery
  const gradeList = useMemo(() => {
    if (systemConfig.customGrades && systemConfig.customGrades.length > 0) {
      return [...systemConfig.customGrades].sort((a, b) => a - b);
    }
    return [3, 4, 5, 6];
  }, [systemConfig.customGrades]);

  const classesMap = useMemo<Record<number, number[]>>(() => {
    if (systemConfig.customClasses) {
      return systemConfig.customClasses;
    }
    return {
      3: [1, 2, 3, 4, 5],
      4: [1, 2, 3, 4, 5, 6],
      5: [1, 2, 3, 4, 5, 6],
      6: [1, 2, 3, 4, 5, 6],
    };
  }, [systemConfig.customClasses]);

  // Grade & Location state
  const [selectedGrade, setSelectedGrade] = useState<number | 'special'>(3);
  const [selectedClassNum, setSelectedClassNum] = useState<number>(1);
  const [deviceFilterType, setDeviceFilterType] = useState<'all' | DeviceType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status Change Modal State (When clicking status button)
  const [statusEditDevice, setStatusEditDevice] = useState<Device | null>(null);
  const [statusEditValue, setStatusEditValue] = useState<DeviceStatus>('normal');
  const [statusIssueReason, setStatusIssueReason] = useState<string>('');

  // Modals / Dialog states
  const [showAddGradeModal, setShowAddGradeModal] = useState<boolean>(false);
  const [newGradeInput, setNewGradeInput] = useState<string>('7');
  
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);
  const [newClassInput, setNewClassInput] = useState<string>('');

  const [showAddDeviceModal, setShowAddDeviceModal] = useState<boolean>(false);
  const [newDeviceClassNum, setNewDeviceClassNum] = useState<number>(21);
  const [newDeviceMgmtNum, setNewDeviceMgmtNum] = useState<string>('');
  const [newDeviceMfr, setNewDeviceMfr] = useState<string>('삼성전자');
  const [newDeviceModel, setNewDeviceModel] = useState<string>('');

  // Open status change dialog
  const handleOpenStatusModal = (device: Device, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStatusEditDevice(device);
    setStatusEditValue(device.status);
    setStatusIssueReason(device.issueDescription || device.repairDescription || '');
  };

  // Save status change with reason
  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusEditDevice) return;

    const statusNames = { normal: '정상', repair: '수리중', broken: '고장' };
    const trimmedReason = statusIssueReason.trim();

    updateDevice(
      statusEditDevice.id,
      {
        status: statusEditValue,
        issueDescription: statusEditValue === 'broken' ? (trimmedReason || '고장 접수') : (statusEditValue === 'repair' ? (trimmedReason || '수리 진행 중') : undefined),
        repairDescription: statusEditValue === 'repair' ? (trimmedReason || '수리 진행 중') : undefined,
      },
      `학급 기기 상태 변경 (${statusNames[statusEditDevice.status]} -> ${statusNames[statusEditValue]}) ${trimmedReason ? `[${trimmedReason}]` : ''}`
    );

    setStatusEditDevice(null);
  };

  // Inline editing for management numbers
  const [editingMgmtId, setEditingMgmtId] = useState<string | null>(null);
  const [tempMgmtVal, setTempMgmtVal] = useState<string>('');

  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'device' | 'batch_devices' | 'class' | 'grade';
    id?: string;
    title: string;
    description: string;
  } | null>(null);

  // Available classes for currently selected grade
  const currentGradeClasses = useMemo(() => {
    if (selectedGrade === 'special') return [];
    return classesMap[selectedGrade] || [1, 2, 3, 4, 5];
  }, [classesMap, selectedGrade]);

  // Ensure selectedClassNum is valid when grade changes
  React.useEffect(() => {
    if (selectedGrade !== 'special' && currentGradeClasses.length > 0) {
      if (!currentGradeClasses.includes(selectedClassNum)) {
        setSelectedClassNum(currentGradeClasses[0]);
      }
    }
  }, [selectedGrade, currentGradeClasses, selectedClassNum]);

  // Determine current active location string
  const currentLocation = useMemo(() => {
    if (selectedGrade === 'special') {
      return '스마트실';
    }
    return `${selectedGrade}학년 ${selectedClassNum}반`;
  }, [selectedGrade, selectedClassNum]);

  // Find consumable record for current location
  const currentConsumable = useMemo(() => {
    return consumables.find((c) => c.location === currentLocation) || {
      id: `cons-smart-temp`,
      location: currentLocation,
      deviceType: 'mouse' as const,
      mouseWiredCount: 0,
      mouseWirelessCount: 25,
      earphoneCount: 25,
      mouseSpareCount: 0,
      earphoneSpareCount: 0,
      requestMemo: '',
      updatedAt: '',
    };
  }, [consumables, currentLocation]);

  // Memo editing state
  const [memoText, setMemoText] = useState<string>('');
  const [isEditingMemo, setIsEditingMemo] = useState<boolean>(false);

  // Sync memo text when location changes
  React.useEffect(() => {
    setMemoText(currentConsumable.requestMemo || '');
    setIsEditingMemo(false);
    setSelectedDeviceIds([]);
    setEditingMgmtId(null);
  }, [currentConsumable, currentLocation]);

  const handleSaveMemo = () => {
    if (currentConsumable.id && !currentConsumable.id.startsWith('cons-smart-temp')) {
      updateConsumableMemo(currentConsumable.id, memoText);
      setIsEditingMemo(false);
    } else {
      // If temporary consumable record, find or update
      const existing = consumables.find((c) => c.location === currentLocation);
      if (existing) {
        updateConsumableMemo(existing.id, memoText);
      }
      setIsEditingMemo(false);
    }
  };

  // Natural numeric sort helper for strings like "1번", "2번", "10번", "CB-0001"
  const parseMgmtNumber = (numStr: string): number => {
    const matched = numStr.match(/\d+/);
    return matched ? parseInt(matched[0], 10) : 999999;
  };

  // Find all devices assigned to this classroom/room
  const classDevices = useMemo(() => {
    const list = devices.filter((d) => {
      const matchLocation = selectedGrade === 'special'
        ? d.location === '스마트실' || d.location.includes('컴퓨터') || d.location.includes('스마트') || d.location.includes('보관실')
        : d.location === currentLocation;
      const matchType = deviceFilterType === 'all' || d.deviceType === deviceFilterType;
      
      const q = searchQuery.toLowerCase().trim();
      const classNumStr = d.classDeviceNumber !== undefined ? `${d.classDeviceNumber}번` : '';
      const rawNumStr = d.classDeviceNumber !== undefined ? String(d.classDeviceNumber) : '';

      const matchSearch = q === '' || 
        d.managementNumber.toLowerCase().includes(q) ||
        d.deviceName.toLowerCase().includes(q) ||
        classNumStr.includes(q) ||
        rawNumStr === q ||
        (d.issueDescription && d.issueDescription.toLowerCase().includes(q));

      return matchLocation && matchType && matchSearch;
    });

    // Sort by class seat/device number naturally (1, 2, ... 20)
    return list.sort((a, b) => {
      const numA = a.classDeviceNumber !== undefined ? a.classDeviceNumber : parseMgmtNumber(a.managementNumber);
      const numB = b.classDeviceNumber !== undefined ? b.classDeviceNumber : parseMgmtNumber(b.managementNumber);
      if (numA !== numB) return numA - numB;
      return a.managementNumber.localeCompare(b.managementNumber);
    });
  }, [devices, currentLocation, selectedGrade, deviceFilterType, searchQuery]);

  // Class Stats (Chromebooks in current class)
  const cbDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchLocation = selectedGrade === 'special'
        ? d.location === '스마트실' || d.location.includes('컴퓨터') || d.location.includes('스마트') || d.location.includes('보관실')
        : d.location === currentLocation;
      return matchLocation && d.deviceType === 'chromebook';
    });
  }, [devices, currentLocation, selectedGrade]);

  const cbTotal = cbDevices.length;
  const cbNormal = cbDevices.filter((d) => d.status === 'normal').length;
  const cbRepair = cbDevices.filter((d) => d.status === 'repair').length;
  const cbBroken = cbDevices.filter((d) => d.status === 'broken').length;

  const totalMice = currentConsumable.mouseWiredCount + currentConsumable.mouseWirelessCount;

  // Suggest next class device number for quick add
  const nextClassDeviceNum = useMemo(() => {
    const existingNums = cbDevices
      .map((d) => d.classDeviceNumber)
      .filter((n): n is number => typeof n === 'number' && !isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    return maxNum + 1;
  }, [cbDevices]);

  // Inline save management number
  const handleSaveInlineMgmtNumber = (deviceId: string) => {
    updateDevice(
      deviceId,
      { managementNumber: tempMgmtVal.trim() },
      tempMgmtVal.trim() ? `관리번호 [${tempMgmtVal.trim()}] 입력` : '관리번호 초기화'
    );
    setEditingMgmtId(null);
  };

  // Handle adding new device
  const handleAddNewDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const mgmtNum = newDeviceMgmtNum.trim();
    const cNum = newDeviceClassNum || nextClassDeviceNum;
    const modelMemo = newDeviceModel.trim();

    addDevice({
      deviceType: 'chromebook',
      managementNumber: mgmtNum,
      classDeviceNumber: cNum,
      deviceName: `${newDeviceMfr} 크롬북`,
      modelName: modelMemo,
      manufacturer: newDeviceMfr,
      location: currentLocation,
      grade: typeof selectedGrade === 'number' ? selectedGrade : undefined,
      classNum: typeof selectedGrade === 'number' ? selectedClassNum : undefined,
      status: 'normal',
      note: modelMemo ? modelMemo : `학급 배정 기기 (${currentLocation} ${cNum}번)`,
    });
    setShowAddDeviceModal(false);
    setNewDeviceMgmtNum('');
    setNewDeviceModel('');
    setNewDeviceClassNum(nextClassDeviceNum + 1);
  };

  // Handle adding new class
  const handleAddNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof selectedGrade !== 'number') return;
    const nextNum = currentGradeClasses.length > 0 ? Math.max(...currentGradeClasses) + 1 : 1;
    const cNum = parseInt(newClassInput, 10) || nextNum;
    addClass(selectedGrade, cNum, true);
    setSelectedClassNum(cNum);
    setShowAddClassModal(false);
    setNewClassInput('');
  };

  // Handle adding new grade
  const handleAddNewGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const gNum = parseInt(newGradeInput, 10);
    if (!isNaN(gNum) && gNum > 0) {
      addGrade(gNum);
      setSelectedGrade(gNum);
      setSelectedClassNum(1);
      setShowAddGradeModal(false);
    }
  };

  // Confirm delete handler
  const executeDeleteAction = () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget.type === 'device' && deleteConfirmTarget.id) {
      deleteDevice(deleteConfirmTarget.id);
      setSelectedDeviceIds((prev) => prev.filter((id) => id !== deleteConfirmTarget.id));
    } else if (deleteConfirmTarget.type === 'batch_devices') {
      deleteMultipleDevices(selectedDeviceIds);
      setSelectedDeviceIds([]);
    } else if (deleteConfirmTarget.type === 'class' && typeof selectedGrade === 'number') {
      const targetClassNum = selectedClassNum;
      deleteClass(selectedGrade, targetClassNum);
      const remaining = currentGradeClasses.filter((c) => c !== targetClassNum);
      if (remaining.length > 0) {
        setSelectedClassNum(remaining[0]);
      } else {
        setSelectedClassNum(1);
      }
    } else if (deleteConfirmTarget.type === 'grade' && typeof selectedGrade === 'number') {
      const targetGrade = selectedGrade;
      deleteGrade(targetGrade);
      const remainingGrades = gradeList.filter((g) => g !== targetGrade);
      if (remainingGrades.length > 0) {
        setSelectedGrade(remainingGrades[0]);
        const firstClass = classesMap[remainingGrades[0]]?.[0] || 1;
        setSelectedClassNum(firstClass);
      } else {
        setSelectedGrade('special');
      }
    }

    setDeleteConfirmTarget(null);
  };

  // Select all / deselect all checkboxes
  const handleSelectAllDevices = () => {
    if (selectedDeviceIds.length === classDevices.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(classDevices.map((d) => d.id));
    }
  };

  const handleToggleSelectDevice = (id: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. TOP HEADER & GRADE/ROOM SELECTOR */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-purple-600 mb-1">
              Classroom Digital Devices
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <School className="w-7 h-7 text-purple-900" />
              학급별 디지털기기 현황
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              학급을 선택하여 배정된 크롬북, 마우스, 이어폰의 수량 및 고장 상태를 확인하고 관리번호를 편집합니다.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">현재 선택:</span>
              <span className="px-4 py-1.5 rounded-full bg-purple-900 text-white font-black text-sm shadow-sm">
                {currentLocation}
              </span>
            </div>

            {typeof selectedGrade === 'number' && currentGradeClasses.length > 0 && (
              <button
                onClick={() => {
                  setDeleteConfirmTarget({
                    type: 'class',
                    title: `${currentLocation} 삭제`,
                    description: `${currentLocation}의 모든 기기 배정 정보 및 소모품 수량이 삭제됩니다. 정말 삭제하시겠습니까?`,
                  });
                }}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="현재 선택된 반 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{selectedClassNum}반 삭제</span>
              </button>
            )}
          </div>
        </div>

        {/* Grade Tabs with Add/Delete Grade */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">학년 선택</div>
            {typeof selectedGrade === 'number' && (
              <button
                onClick={() => {
                  setDeleteConfirmTarget({
                    type: 'grade',
                    title: `${selectedGrade}학년 전체 삭제`,
                    description: `${selectedGrade}학년의 모든 반(${currentGradeClasses.length > 0 ? currentGradeClasses.join('반, ') + '반' : '모든 반'})과 등록된 모든 기기가 삭제됩니다. 진행하시겠습니까?`,
                  });
                }}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                title={`${selectedGrade}학년 삭제`}
              >
                <Trash2 className="w-3 h-3" />
                <span>{selectedGrade}학년 삭제</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-none">
            {gradeList.map((grade) => (
              <button
                key={grade}
                id={`tab-grade-${grade}`}
                onClick={() => {
                  setSelectedGrade(grade);
                  const firstClass = classesMap[grade]?.[0] || 1;
                  setSelectedClassNum(firstClass);
                }}
                className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all shrink-0 cursor-pointer ${
                  selectedGrade === grade
                    ? 'bg-purple-900 text-white shadow-md shadow-purple-950/20 scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {grade}학년
              </button>
            ))}
            
            <button
              id="tab-grade-special"
              onClick={() => {
                setSelectedGrade('special');
              }}
              className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all shrink-0 cursor-pointer ${
                selectedGrade === 'special'
                  ? 'bg-purple-900 text-white shadow-md shadow-purple-950/20 scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              스마트실
            </button>

            {/* Add Grade Button */}
            <button
              onClick={() => {
                const nextGrade = gradeList.length > 0 ? Math.max(...gradeList) + 1 : 1;
                setNewGradeInput(String(nextGrade));
                setShowAddGradeModal(true);
              }}
              className="px-4 py-2 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/60 text-purple-800 hover:bg-purple-100 text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
              title="새 학년 추가"
            >
              <span className="text-base font-black text-purple-700 leading-none mr-0.5">+</span>
              <span>학년 추가</span>
            </button>
          </div>
        </div>

        {/* Class Sub-buttons (Only for standard grades, removed for 스마트실) */}
        {selectedGrade !== 'special' && (
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {selectedGrade}학년 학급 선택
              </div>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {currentGradeClasses.map((classNum) => (
                <button
                  key={classNum}
                  id={`btn-class-${selectedGrade}-${classNum}`}
                  onClick={() => setSelectedClassNum(classNum)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedClassNum === classNum
                      ? 'bg-purple-800 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {classNum}반
                </button>
              ))}
              {/* + 반 추가 Button directly next to class buttons */}
              <button
                onClick={() => {
                  const nextNum = currentGradeClasses.length > 0 ? Math.max(...currentGradeClasses) + 1 : 1;
                  addClass(selectedGrade, nextNum, true);
                  setSelectedClassNum(nextNum);
                }}
                className="px-3.5 py-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/60 text-purple-800 hover:bg-purple-100 text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
                title={`${selectedGrade}학년에 다음 반(${currentGradeClasses.length > 0 ? Math.max(...currentGradeClasses) + 1 : 1}반) 즉시 추가 (1~20번 크롬북 자동 생성)`}
              >
                <span className="text-base font-black text-purple-700 leading-none mr-0.5">+</span>
                <span>반 추가</span>
              </button>
            </div>
          </div>
        )}

        {/* 🌟 USER REQUEST: "각반에 들어가도 정상 수리중 고장이 학년반 밑에 보이도록 해주세요" */}
        <div className="pt-4 border-t border-slate-100">
          <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <span className="text-sm font-black text-slate-900">
                {currentLocation} 크롬북 실시간 상태
              </span>
              <span className="text-xs font-bold text-slate-500">
                (총 {cbTotal}대 배정)
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Green: 정상 */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300/80 font-black text-xs shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>정상 {cbNormal}대</span>
              </div>

              {/* Yellow: 수리중 */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300/80 font-black text-xs shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>수리중 {cbRepair}대</span>
              </div>

              {/* Red: 고장 */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-100 text-rose-900 border border-rose-300/80 font-black text-xs shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>고장 {cbBroken}대</span>
              </div>

              {/* Operational Rate */}
              <div className="text-xs font-bold text-purple-950 bg-white/80 px-2.5 py-1 rounded-xl border border-purple-200">
                가동률: <span className="font-black text-purple-700">{cbTotal > 0 ? ((cbNormal / cbTotal) * 100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CLASSROOM INVENTORY SUMMARY & CONSUMABLES ADJUSTER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A. Chromebook Summary for this class */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-purple-700">크롬북 배정 현황</div>
                  <h3 className="font-black text-slate-900 text-base">크롬북 현황</h3>
                </div>
              </div>
              <span className="text-3xl font-black text-slate-900">
                {cbTotal}<span className="text-sm font-bold text-slate-400 ml-1">대</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4 text-center">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/60">
                <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">정상</div>
                <div className="text-2xl font-black text-emerald-900">{cbNormal}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/60">
                <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">수리 중</div>
                <div className="text-2xl font-black text-amber-900">{cbRepair}</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200/60">
                <div className="text-[11px] text-rose-800 font-bold uppercase tracking-wider">고장</div>
                <div className="text-2xl font-black text-rose-900">{cbBroken}</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between font-bold">
            <span className="text-slate-400 uppercase tracking-wider">정상 가동률</span>
            <span className="text-emerald-700 font-black text-sm">
              {cbTotal > 0 ? ((cbNormal / cbTotal) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* B. Mouse Consumables Adjuster (+/- buttons) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center">
                <Mouse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">마우스 수량</h3>
              </div>
            </div>
            <span className="text-3xl font-black text-slate-900">
              {totalMice}<span className="text-sm font-bold text-slate-400 ml-1">개</span>
            </span>
          </div>

          {/* Wired & Wireless Steppers */}
          <div className="space-y-3">
            {/* Wireless Mouse */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <div className="text-xs font-black text-slate-900">무선 마우스</div>
                <div className="text-[11px] text-slate-400 font-medium">USB 리시버 포함</div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="btn-minus-mouse-wireless"
                  onClick={() => updateConsumableCount(currentConsumable.id, 'mouseWirelessCount', -1)}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-black text-base text-slate-900">
                  {currentConsumable.mouseWirelessCount}
                </span>
                <button
                  id="btn-plus-mouse-wireless"
                  onClick={() => updateConsumableCount(currentConsumable.id, 'mouseWirelessCount', 1)}
                  className="w-8 h-8 rounded-xl bg-purple-900 text-white flex items-center justify-center hover:bg-purple-800 active:scale-95 transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Wired Mouse */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <div className="text-xs font-black text-slate-900">유선 마우스</div>
                <div className="text-[11px] text-slate-400 font-medium">USB A타입</div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="btn-minus-mouse-wired"
                  onClick={() => updateConsumableCount(currentConsumable.id, 'mouseWiredCount', -1)}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-black text-base text-slate-900">
                  {currentConsumable.mouseWiredCount}
                </span>
                <button
                  id="btn-plus-mouse-wired"
                  onClick={() => updateConsumableCount(currentConsumable.id, 'mouseWiredCount', 1)}
                  className="w-8 h-8 rounded-xl bg-purple-900 text-white flex items-center justify-center hover:bg-purple-800 active:scale-95 transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* C. Earphone Consumables Adjuster & Request Memo */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">이어폰 및 요청 메모</h3>
              </div>
            </div>
            <span className="text-3xl font-black text-slate-900">
              {currentConsumable.earphoneCount}<span className="text-sm font-bold text-slate-400 ml-1">개</span>
            </span>
          </div>

          {/* Earphone Stepper */}
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <div className="text-xs font-black text-slate-900">이어폰 비치 수량</div>
              <div className="text-[11px] text-slate-400 font-medium">3.5mm / C타입 겸용</div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                id="btn-minus-earphone"
                onClick={() => updateConsumableCount(currentConsumable.id, 'earphoneCount', -1)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-xs"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-black text-base text-slate-900">
                {currentConsumable.earphoneCount}
              </span>
              <button
                id="btn-plus-earphone"
                onClick={() => updateConsumableCount(currentConsumable.id, 'earphoneCount', 1)}
                className="w-8 h-8 rounded-xl bg-purple-900 text-white flex items-center justify-center hover:bg-purple-800 active:scale-95 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Request Memo Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
                <span>학급 추가 요청 사항</span>
              </span>
              {isEditingMemo ? (
                <button
                  onClick={handleSaveMemo}
                  className="text-xs text-purple-900 font-black hover:underline flex items-center gap-0.5"
                >
                  <Save className="w-3 h-3" />
                  <span>저장</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingMemo(true)}
                  className="text-xs text-slate-500 hover:text-purple-900 font-bold flex items-center gap-0.5"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>수정</span>
                </button>
              )}
            </div>

            {isEditingMemo ? (
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="예: 마우스 2개 교체 필요&#10;이어폰 젠더 추가 요망 등..."
                rows={3}
                className="w-full text-xs p-3 rounded-2xl border border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-900 bg-purple-50/20 font-medium whitespace-pre-wrap"
              />
            ) : (
              <div 
                onClick={() => setIsEditingMemo(true)}
                className="text-xs p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 min-h-[48px] cursor-pointer hover:bg-purple-50/30 transition-colors font-medium whitespace-pre-line break-words"
              >
                {currentConsumable.requestMemo ? (
                  <span className="text-slate-900 font-semibold">{currentConsumable.requestMemo}</span>
                ) : (
                  <span className="text-slate-400 italic">작성된 요청 사항이 없습니다. (클릭하여 작성)</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. CLASSROOM DEVICE ROSTER TABLE (반 번호 1~20번 중심 관리, 관리번호 추후 입력 지원) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Device Roster & Management Numbers</div>
            <h3 className="font-black text-slate-900 text-xl flex items-center gap-2">
              <span>{currentLocation} 기기목록</span>
              <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-purple-100 text-purple-900">
                {classDevices.length}대
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              각 반의 반 번호(1~20번)별 기기 상태를 확인하고, 관리번호를 직접 입력하거나 관리할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search within class */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="반번호(1번) / 관리번호 / 기기명"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-900 w-52 font-medium"
              />
            </div>

            {/* Type Filter */}
            <select
              value={deviceFilterType}
              onChange={(e) => setDeviceFilterType(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-900 bg-white font-bold text-slate-700"
            >
              <option value="all">전체 기기</option>
              <option value="chromebook">크롬북만</option>
              <option value="mouse">마우스</option>
              <option value="earphone">이어폰</option>
            </select>

            {/* USER REQUEST: Add Device / Chromebook */}
            <button
              onClick={() => {
                setNewDeviceClassNum(nextClassDeviceNum);
                setNewDeviceMgmtNum('');
                setNewDeviceModel('');
                setShowAddDeviceModal(true);
              }}
              className="px-3.5 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>기기 추가</span>
            </button>

            {/* Batch Delete Selected */}
            {selectedDeviceIds.length > 0 && (
              <button
                onClick={() => {
                  setDeleteConfirmTarget({
                    type: 'batch_devices',
                    title: `선택한 ${selectedDeviceIds.length}개 기기 삭제`,
                    description: `선택하신 ${selectedDeviceIds.length}개 기기를 삭제하시겠습니까?`,
                  });
                }}
                className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>선택 삭제 ({selectedDeviceIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Device Table */}
        {classDevices.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Laptop className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-black text-slate-700">이 학급에 등록된 기기가 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              [기기 추가] 버튼을 눌러 1번부터 크롬북을 배정할 수 있습니다.
            </p>
            <button
              onClick={() => {
                setNewDeviceClassNum(1);
                setNewDeviceMgmtNum('');
                setNewDeviceModel('');
                setShowAddDeviceModal(true);
              }}
              className="px-4 py-2 bg-purple-900 text-white text-xs font-black rounded-xl hover:bg-purple-800 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>1번 기기 등록하기</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      onClick={handleSelectAllDevices}
                      className="text-slate-400 hover:text-purple-900"
                      title="전체 선택/해제"
                    >
                      {selectedDeviceIds.length === classDevices.length && classDevices.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-purple-900" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-20 text-center whitespace-nowrap">반 번호</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">관리번호</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[80px]">기기종류</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">기기명</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[90px]">상태</th>
                  <th className="py-3 px-3 min-w-[180px]">고장/수리내용</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap w-24">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classDevices.map((device, idx) => {
                  const badge = getStatusBadgeStyle(device.status);
                  const isSelected = selectedDeviceIds.includes(device.id);
                  const displayClassNum = device.classDeviceNumber !== undefined ? `${device.classDeviceNumber}번` : `${idx + 1}번`;

                  return (
                    <tr 
                      key={device.id} 
                      className={`transition-colors cursor-pointer group ${
                        isSelected ? 'bg-purple-50/80' : 'hover:bg-purple-50/40'
                      }`}
                      onClick={() => onSelectDevice(device)}
                    >
                      {/* Checkbox column */}
                      <td 
                        className="py-3 px-3 text-center" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectDevice(device.id);
                        }}
                      >
                        <button className="text-slate-400 hover:text-purple-900">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-900" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* 1. 반 번호 Column (Primary Class Identifier) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-black text-purple-950 text-sm">
                        <span className="inline-flex items-center justify-center min-w-[38px] px-2 py-0.5 rounded-xl bg-purple-100 text-purple-950 border border-purple-200/80 font-black text-xs">
                          {displayClassNum}
                        </span>
                      </td>

                      {/* 2. 관리번호 Column (Editable asset number, initially blank) */}
                      <td className="py-3 px-3 text-xs font-mono whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {editingMgmtId === device.id ? (
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={tempMgmtVal}
                              onChange={(e) => setTempMgmtVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineMgmtNumber(device.id);
                                if (e.key === 'Escape') setEditingMgmtId(null);
                              }}
                              onBlur={() => handleSaveInlineMgmtNumber(device.id)}
                              placeholder="관리번호 입력"
                              className="px-2.5 py-1 text-xs border-2 border-purple-600 rounded-lg focus:outline-none bg-white font-mono font-bold text-purple-950 w-32 shadow-xs"
                            />
                            <button
                              onClick={() => handleSaveInlineMgmtNumber(device.id)}
                              className="p-1.5 bg-purple-900 text-white rounded-lg hover:bg-purple-800"
                              title="저장"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                              setEditingMgmtId(device.id);
                              setTempMgmtVal(device.managementNumber || '');
                            }}
                            className="inline-flex items-center gap-1.5 cursor-pointer group/mgmt"
                            title="클릭하여 자산 관리번호 입력/수정"
                          >
                            {device.managementNumber ? (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 group-hover/mgmt:bg-purple-100 text-slate-800 group-hover/mgmt:text-purple-950 border border-slate-200 font-mono font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap">
                                {device.managementNumber}
                                <Edit3 className="w-3 h-3 text-slate-400 group-hover/mgmt:text-purple-700 opacity-60 group-hover/mgmt:opacity-100" />
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-400 hover:text-purple-700 border border-dashed border-slate-300 hover:border-purple-400 font-medium text-[11px] inline-flex items-center gap-1 transition-colors whitespace-nowrap">
                                <Plus className="w-3 h-3" />
                                <span>관리번호 입력</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Device Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] whitespace-nowrap inline-block">
                          {device.deviceType === 'chromebook' ? '크롬북' : device.deviceType === 'mouse' ? '마우스' : '이어폰'}
                        </span>
                      </td>

                      {/* Device Name */}
                      <td className="py-3 px-3 text-slate-900 font-bold whitespace-nowrap">
                        <span className="whitespace-nowrap block">{device.deviceName}</span>
                      </td>

                      {/* Status Button for modal status & issue reason */}
                      <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(device)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition-all hover:scale-105 hover:shadow-xs active:scale-95 cursor-pointer font-sans whitespace-nowrap ${badge.bg}`}
                          title="클릭하여 상태 및 고장원인/수리내용 작성"
                        >
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          <span>{badge.text}</span>
                        </button>
                      </td>

                      {/* Issues / Repair Notes (Next to Status) */}
                      <td className="py-3 px-3 text-xs font-medium">
                        {device.status === 'broken' ? (
                          <div 
                            onClick={() => handleOpenStatusModal(device)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200 cursor-pointer hover:bg-rose-100 transition-colors max-w-sm"
                            title="클릭하여 고장 원인 수정"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate">{device.issueDescription || '고장 원인 미기재 (클릭하여 입력)'}</span>
                          </div>
                        ) : device.status === 'repair' ? (
                          <div 
                            onClick={() => handleOpenStatusModal(device)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors max-w-sm"
                            title="클릭하여 수리 내용 수정"
                          >
                            <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{device.repairDescription || device.issueDescription || '수리 진행 중 (클릭하여 입력)'}</span>
                          </div>
                        ) : device.note ? (
                          <span className="text-slate-500 truncate block max-w-xs">{device.note}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Actions: View Details, Delete */}
                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onSelectDevice(device)}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors whitespace-nowrap"
                          >
                            상세
                          </button>

                          {/* Individual Delete Button */}
                          <button
                            onClick={() => {
                              const targetLabel = device.classDeviceNumber ? `${displayClassNum} 기기` : device.managementNumber ? `관리번호 ${device.managementNumber}` : device.deviceName;
                              setDeleteConfirmTarget({
                                type: 'device',
                                id: device.id,
                                title: `${targetLabel} 삭제`,
                                description: `${currentLocation}의 ${targetLabel} (${device.deviceName})를 삭제하시겠습니까?`,
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="기기 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD DEVICE TO CLASS */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Laptop className="w-5 h-5 text-purple-900" />
                <span>{currentLocation} 기기(크롬북) 추가</span>
              </h3>
              <button
                onClick={() => setShowAddDeviceModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewDevice} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  반 번호 (학급 내 배정 번호, 예: 21번)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newDeviceClassNum}
                  onChange={(e) => setNewDeviceClassNum(parseInt(e.target.value, 10) || 1)}
                  placeholder={`예: ${nextClassDeviceNum}`}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-900 font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  학교 자산 관리번호 <span className="text-slate-400 font-normal">(선택 사항 - 나중에 입력 가능)</span>
                </label>
                <input
                  type="text"
                  value={newDeviceMgmtNum}
                  onChange={(e) => setNewDeviceMgmtNum(e.target.value)}
                  placeholder="예: CB-0120 (비워두어도 등록 가능)"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-900 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  제조사 / 크롬북 종류 <span className="text-slate-400 font-normal">(옵션 선택)</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[
                    { id: '삼성전자', label: '삼성전자' },
                    { id: 'LG', label: 'LG' },
                    { id: '레노버', label: '레노버' },
                    { id: 'ASUS', label: 'ASUS' },
                    { id: '기타', label: '기타' },
                  ].map((opt) => {
                    const isSelected = newDeviceMfr === opt.id || (opt.id === 'LG' && newDeviceMfr === 'LG전자');
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNewDeviceMfr(opt.id)}
                        className={`py-2 px-1 rounded-xl border text-[11px] font-black transition-all ${
                          isSelected
                            ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  기기 메모 <span className="text-slate-400 font-normal">(선택 사항 - 자유 메모 작성)</span>
                </label>
                <input
                  type="text"
                  value={newDeviceModel}
                  onChange={(e) => setNewDeviceModel(e.target.value)}
                  placeholder="예: 2024년 구입, 터치펜 포함 등 (비워두셔도 됩니다)"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-900 font-medium text-xs bg-white text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-900 text-white font-black hover:bg-purple-800 shadow-sm"
                >
                  기기 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CLASS */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-900" />
                <span>{selectedGrade}학년 새 학급(반) 추가</span>
              </h3>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewClass} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  추가할 반 번호 (숫자)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newClassInput}
                  onChange={(e) => setNewClassInput(e.target.value)}
                  placeholder="예: 7"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-900 font-bold text-sm"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * 반 추가 시 해당 반에 1~20번 크롬북 및 기본 마우스/이어폰이 자동 생성됩니다.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-900 text-white font-black hover:bg-purple-800"
                >
                  학급 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD GRADE */}
      {showAddGradeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-purple-900" />
                <span>새 학년 추가</span>
              </h3>
              <button
                onClick={() => setShowAddGradeModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewGrade} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  추가할 학년 번호 (숫자)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={newGradeInput}
                  onChange={(e) => setNewGradeInput(e.target.value)}
                  placeholder="예: 7"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-900 font-bold text-sm"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * 학년 추가 시 1반이 기본 함께 생성됩니다.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddGradeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-900 text-white font-black hover:bg-purple-800"
                >
                  학년 추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center space-x-3 text-rose-600 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                {deleteConfirmTarget.title}
              </h3>
            </div>

            <p className="text-xs text-slate-600 font-medium my-4 leading-relaxed">
              {deleteConfirmTarget.description}
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={executeDeleteAction}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 shadow-sm"
              >
                확인 및 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: STATUS EDIT MODAL (상태 변경 및 고장원인/수리내용 작성) */}
      {statusEditDevice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-900" />
                  <span>기기 상태 및 고장·수리 내용 관리</span>
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  {statusEditDevice.location} {statusEditDevice.classDeviceNumber ? `${statusEditDevice.classDeviceNumber}번` : ''} · {statusEditDevice.deviceName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusEditDevice(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 mt-4 text-xs">
              {/* Status Selection Buttons */}
              <div>
                <label className="block font-black text-slate-900 mb-2">
                  기기 상태 선택
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusEditValue('normal')}
                    className={`py-3 px-3 rounded-2xl border font-black flex flex-col items-center gap-1.5 transition-all ${
                      statusEditValue === 'normal'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xs">정상</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusEditValue('repair')}
                    className={`py-3 px-3 rounded-2xl border font-black flex flex-col items-center gap-1.5 transition-all ${
                      statusEditValue === 'repair'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-200'
                    }`}
                  >
                    <Wrench className="w-5 h-5" />
                    <span className="text-xs">수리중</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusEditValue('broken')}
                    className={`py-3 px-3 rounded-2xl border font-black flex flex-col items-center gap-1.5 transition-all ${
                      statusEditValue === 'broken'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:border-rose-200'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-xs">고장</span>
                  </button>
                </div>
              </div>

              {/* Reason / Details Input according to status */}
              {statusEditValue === 'broken' && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 animate-in fade-in duration-150">
                  <label className="block font-black text-rose-950">
                    고장 원인 및 세부 증상 입력 <span className="text-rose-600 font-bold">*</span>
                  </label>
                  {/* Quick preset tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '화면/액정 파손',
                      '키보드 불량',
                      '충전 단자 불량',
                      '전원 안 켜짐',
                      '터치패드 오류',
                      '힌지 파손',
                      '외관 파손',
                      '분실/미반납',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setStatusIssueReason(tag)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          statusIssueReason === tag
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={statusIssueReason}
                    onChange={(e) => setStatusIssueReason(e.target.value)}
                    placeholder="고장 증상을 직접 입력하거나 위의 추천 태그를 누르세요 (예: 액정 파손으로 화면 미출력)"
                    className="w-full p-2.5 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium text-xs text-slate-900"
                    required
                  />
                </div>
              )}

              {statusEditValue === 'repair' && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 animate-in fade-in duration-150">
                  <label className="block font-black text-amber-950">
                    수리 진행 내용 및 AS 접수 현황 입력
                  </label>
                  {/* Quick preset tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'AS 센터 접수 완료',
                      '액정 패널 교체 중',
                      '키보드 부품 수리 중',
                      '배터리 점검 중',
                      '부품 입고 대기',
                      '제조사 수리 의뢰',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setStatusIssueReason(tag)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          statusIssueReason === tag
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={statusIssueReason}
                    onChange={(e) => setStatusIssueReason(e.target.value)}
                    placeholder="수리 진행 상황을 입력하거나 위의 태그를 누르세요 (예: 2026-08-23 AS센터 액정 교체 접수)"
                    className="w-full p-2.5 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium text-xs text-slate-900"
                  />
                </div>
              )}

              {statusEditValue === 'normal' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 space-y-1.5 animate-in fade-in duration-150">
                  <p className="font-black text-xs flex items-center gap-1.5 text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600" />
                    정상 상태로 전환됩니다.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                    기기가 정상으로 표시되며 학생 수업 배정 및 사용이 가능해집니다. 기존 고장·수리 내역은 조치 완료로 변경됩니다.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setStatusEditDevice(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-900 text-white font-black hover:bg-purple-800 shadow-sm"
                >
                  상태 및 내용 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
