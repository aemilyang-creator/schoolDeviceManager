import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Laptop, 
  Mouse, 
  Headphones, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  PlusCircle, 
  Trash2, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare, 
  Square,
  ArrowUpDown,
  Wrench,
  Sparkles,
  RefreshCw,
  Check
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { Device, DeviceType, DeviceStatus, DeviceFilterState } from '../types';
import { getStatusBadgeStyle, formatDate, getDeviceTypeLabel } from '../utils/formatters';

interface DeviceManagementProps {
  onSelectDevice: (device: Device) => void;
  onOpenRegisterModal: () => void;
}

export const DeviceManagement: React.FC<DeviceManagementProps> = ({
  onSelectDevice,
  onOpenRegisterModal,
}) => {
  const { devices, stats, deleteDevice, deleteMultipleDevices, batchUpdateStatus, updateDevice } = useDevices();

  // Helper to rank locations (1학년 1반 < 1학년 2반 < ... < 6학년 < 스마트실)
  const getLocationRank = (loc: string) => {
    const match = loc.match(/(\d+)학년\s*(\d+)반/);
    if (match) {
      return { grade: parseInt(match[1], 10), classNum: parseInt(match[2], 10), isSmart: 0, raw: loc };
    }
    if (loc.includes('스마트')) {
      return { grade: 999, classNum: 999, isSmart: 1, raw: '스마트실' };
    }
    return { grade: 1000, classNum: 1000, isSmart: 2, raw: loc };
  };

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | DeviceType>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | DeviceStatus>('all');
  const [selectedMfr, setSelectedMfr] = useState<'all' | string>('all');
  const [selectedLocation, setSelectedLocation] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<'location' | 'classDeviceNumber' | 'managementNumber' | 'updatedAt' | 'status'>('location');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Status Change Modal State (When clicking status button)
  const [statusEditDevice, setStatusEditDevice] = useState<Device | null>(null);
  const [statusEditValue, setStatusEditValue] = useState<DeviceStatus>('normal');
  const [statusIssueReason, setStatusIssueReason] = useState<string>('');

  // Delete Modal & Confirmation States
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState<boolean>(false);
  const [batchStatusTarget, setBatchStatusTarget] = useState<DeviceStatus | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);

  const showToast = (message: string) => {
    setActionToast(message);
    setTimeout(() => {
      setActionToast(null);
    }, 3000);
  };

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
      `전체 기기 관리에서 상태 변경 (${statusNames[statusEditDevice.status]} -> ${statusNames[statusEditValue]}) ${trimmedReason ? `[${trimmedReason}]` : ''}`
    );

    setStatusEditDevice(null);
  };

  // Extract all unique locations sorted by grade & class order (1학년 1반 -> 6학년 -> 스마트실)
  const allLocations = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      let loc = d.location;
      if (loc.includes('컴퓨터') || loc.includes('AI 스마트') || loc.includes('보관실')) {
        loc = '스마트실';
      }
      set.add(loc);
    });

    return Array.from(set).sort((a, b) => {
      const rankA = getLocationRank(a);
      const rankB = getLocationRank(b);
      if (rankA.grade !== rankB.grade) return rankA.grade - rankB.grade;
      if (rankA.classNum !== rankB.classNum) return rankA.classNum - rankB.classNum;
      if (rankA.isSmart !== rankB.isSmart) return rankA.isSmart - rankB.isSmart;
      return a.localeCompare(b);
    });
  }, [devices]);

  const allManufacturers = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      if (d.manufacturer) set.add(d.manufacturer);
    });
    return Array.from(set).sort();
  }, [devices]);

  const samsungCount = stats.chromebook.byManufacturer['삼성전자']?.total || 0;
  const lgCount = (stats.chromebook.byManufacturer['LG']?.total || 0) + (stats.chromebook.byManufacturer['LG전자']?.total || 0);
  const lenovoCount = stats.chromebook.byManufacturer['레노버']?.total || 0;
  const asusCount = stats.chromebook.byManufacturer['ASUS']?.total || 0;
  const otherCount = Object.entries(stats.chromebook.byManufacturer)
    .filter(([key]) => !['삼성전자', 'LG', 'LG전자', '레노버', 'ASUS'].includes(key))
    .reduce((sum, [, val]) => sum + ((val as { total?: number })?.total || 0), 0);

  const mfrFilterOptions = useMemo(() => [
    { key: 'all', label: '전체', count: stats.chromebook.total },
    { key: '삼성전자', label: '삼성전자', count: samsungCount },
    { key: 'LG', label: 'LG', count: lgCount },
    { key: '레노버', label: '레노버', count: lenovoCount },
    { key: 'ASUS', label: 'ASUS', count: asusCount },
    ...(otherCount > 0 ? [{ key: '기타', label: '기타', count: otherCount }] : []),
  ], [stats.chromebook.total, samsungCount, lgCount, lenovoCount, asusCount, otherCount]);

  // Filtered & Sorted Devices
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const classNumStr = d.classDeviceNumber !== undefined ? `${d.classDeviceNumber}번` : '';
      const rawNumStr = d.classDeviceNumber !== undefined ? String(d.classDeviceNumber) : '';

      const matchSearch =
        q === '' ||
        d.managementNumber.toLowerCase().includes(q) ||
        d.deviceName.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q) ||
        classNumStr.includes(q) ||
        rawNumStr === q ||
        (d.manufacturer && d.manufacturer.toLowerCase().includes(q)) ||
        (d.modelName && d.modelName.toLowerCase().includes(q)) ||
        (d.issueDescription && d.issueDescription.toLowerCase().includes(q)) ||
        (d.repairDescription && d.repairDescription.toLowerCase().includes(q));

      const matchType = selectedType === 'all' || d.deviceType === selectedType;
      const matchStatus = selectedStatus === 'all' || d.status === selectedStatus;
      
      const matchMfr =
        selectedMfr === 'all' ||
        (selectedMfr === 'LG' && (d.manufacturer === 'LG' || d.manufacturer === 'LG전자' || d.manufacturer === 'LG ELECTRONICS')) ||
        (selectedMfr === 'LG전자' && (d.manufacturer === 'LG' || d.manufacturer === 'LG전자' || d.manufacturer === 'LG ELECTRONICS')) ||
        (selectedMfr === '삼성전자' && (d.manufacturer === '삼성전자' || d.manufacturer?.includes('삼성'))) ||
        (selectedMfr === '레노버' && (d.manufacturer === '레노버' || d.manufacturer?.toLowerCase().includes('lenovo'))) ||
        (selectedMfr === 'ASUS' && (d.manufacturer === 'ASUS' || d.manufacturer?.toLowerCase().includes('asus'))) ||
        (selectedMfr === '기타' && !['삼성전자', 'LG', 'LG전자', '레노버', 'ASUS'].includes(d.manufacturer || '')) ||
        d.manufacturer === selectedMfr;

      const matchLoc = selectedLocation === 'all' || d.location === selectedLocation;

      return matchSearch && matchType && matchStatus && matchMfr && matchLoc;
    }).sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'location') {
        // 1. Grade / Class rank (1학년 1반 < ... < 6학년 < 스마트실)
        const rankA = getLocationRank(a.location);
        const rankB = getLocationRank(b.location);
        if (rankA.grade !== rankB.grade) {
          comparison = rankA.grade - rankB.grade;
        } else if (rankA.classNum !== rankB.classNum) {
          comparison = rankA.classNum - rankB.classNum;
        } else if (rankA.isSmart !== rankB.isSmart) {
          comparison = rankA.isSmart - rankB.isSmart;
        } else {
          // 2. Class device number inside the same room (1번, 2번 ... 20번)
          const numA = a.classDeviceNumber !== undefined ? a.classDeviceNumber : 999999;
          const numB = b.classDeviceNumber !== undefined ? b.classDeviceNumber : 999999;
          if (numA !== numB) {
            comparison = numA - numB;
          } else {
            comparison = a.managementNumber.localeCompare(b.managementNumber);
          }
        }
      } else if (sortBy === 'classDeviceNumber') {
        const numA = a.classDeviceNumber !== undefined ? a.classDeviceNumber : 999999;
        const numB = b.classDeviceNumber !== undefined ? b.classDeviceNumber : 999999;
        if (numA !== numB) {
          comparison = numA - numB;
        } else {
          const rankA = getLocationRank(a.location);
          const rankB = getLocationRank(b.location);
          if (rankA.grade !== rankB.grade) {
            comparison = rankA.grade - rankB.grade;
          } else if (rankA.classNum !== rankB.classNum) {
            comparison = rankA.classNum - rankB.classNum;
          } else {
            comparison = rankA.isSmart - rankB.isSmart;
          }
        }
      } else if (sortBy === 'managementNumber') {
        const numA = a.classDeviceNumber !== undefined ? a.classDeviceNumber : parseInt((a.managementNumber.match(/\d+/) || ['999999'])[0], 10);
        const numB = b.classDeviceNumber !== undefined ? b.classDeviceNumber : parseInt((b.managementNumber.match(/\d+/) || ['999999'])[0], 10);
        if (numA !== numB) {
          comparison = numA - numB;
        } else {
          comparison = a.managementNumber.localeCompare(b.managementNumber);
        }
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortBy === 'updatedAt') {
        comparison = (a.updatedAt || '').localeCompare(b.updatedAt || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [devices, searchQuery, selectedType, selectedStatus, selectedMfr, selectedLocation, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage) || 1;
  const paginatedDevices = useMemo(() => {
    if (itemsPerPage >= 99999) return filteredDevices;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDevices.slice(start, start + itemsPerPage);
  }, [filteredDevices, currentPage, itemsPerPage]);

  // Select all on current page
  const isAllCurrentSelected = paginatedDevices.length > 0 && paginatedDevices.every((d) => selectedIds.includes(d.id));

  const handleToggleSelectAll = () => {
    if (isAllCurrentSelected) {
      const currentIds = new Set(paginatedDevices.map((d) => d.id));
      setSelectedIds((prev) => prev.filter((id) => !currentIds.has(id)));
    } else {
      const currentIds = paginatedDevices.map((d) => d.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Batch Status Change
  const handleBatchStatus = (status: DeviceStatus) => {
    if (selectedIds.length === 0) return;
    setBatchStatusTarget(status);
  };

  const handleConfirmBatchStatus = () => {
    if (!batchStatusTarget || selectedIds.length === 0) return;
    const count = selectedIds.length;
    const statusText = batchStatusTarget === 'normal' ? '정상' : batchStatusTarget === 'repair' ? '수리중' : '고장';
    batchUpdateStatus(selectedIds, batchStatusTarget, `일괄 상태 변경 (${statusText})`);
    showToast(`${count}개 기기의 상태가 [${statusText}](으)로 변경되었습니다.`);
    setSelectedIds([]);
    setBatchStatusTarget(null);
  };

  // Batch Delete
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setShowBatchDeleteConfirm(true);
  };

  const handleConfirmBatchDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    deleteMultipleDevices(selectedIds);
    showToast(`${count}개 기기가 목록 및 클라우드에서 영구 삭제되었습니다.`);
    setSelectedIds([]);
    setShowBatchDeleteConfirm(false);
  };

  const handleConfirmSingleDelete = () => {
    if (!deviceToDelete) return;
    const name = deviceToDelete.managementNumber || deviceToDelete.deviceName || '기기';
    deleteDevice(deviceToDelete.id);
    showToast(`${name} 기기가 정상적으로 삭제되었습니다.`);
    setDeviceToDelete(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['보관장소', '반번호', '관리번호', '기기종류', '기기명', '상태', '고장내용', '수리내용', '비고'];
    const rows = filteredDevices.map((d) => [
      d.location,
      d.classDeviceNumber !== undefined ? `${d.classDeviceNumber}번` : '',
      d.managementNumber,
      getDeviceTypeLabel(d.deviceType),
      d.deviceName,
      d.status === 'normal' ? '정상' : d.status === 'repair' ? '수리중' : '고장',
      d.issueDescription ? `"${d.issueDescription.replace(/"/g, '""')}"` : '',
      d.repairDescription ? `"${d.repairDescription.replace(/"/g, '""')}"` : '',
      d.note ? `"${d.note.replace(/"/g, '""')}"` : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `디지털기기_목록_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: 'location' | 'classDeviceNumber' | 'managementNumber' | 'updatedAt' | 'status') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. FILTER & SEARCH CONTROL PANEL */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-bold text-purple-700">기기 통합 관리</div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Laptop className="w-6 h-6 text-purple-900" />
              전체 기기 목록 및 관리
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              학교 내 모든 디지털 기기를 검색, 상태 변경, 일괄 편집 및 엑셀 데이터로 관리합니다.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>CSV 내보내기</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Text Search Field */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-device-search"
              placeholder="관리번호 / 기기명 / 보관장소 / 고장내용 검색..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-900 bg-slate-50/50 font-medium"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-900 bg-white font-bold text-slate-700"
            >
              <option value="all">기기 상태 (전체)</option>
              <option value="normal">정상 (사용 가능)</option>
              <option value="repair">수리 중 (AS진행)</option>
              <option value="broken">고장 (사용 불가)</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-900 bg-white font-bold text-slate-700"
            >
              <option value="all">보관 장소 (전체)</option>
              {allLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2 text-slate-500 font-medium">
            <span>검색 결과: <strong className="text-purple-900 font-black font-sans">{filteredDevices.length}</strong>개</span>
            {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || selectedLocation !== 'all' || selectedMfr !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedStatus('all');
                  setSelectedMfr('all');
                  setSelectedLocation('all');
                  setCurrentPage(1);
                }}
                className="text-purple-900 hover:text-purple-700 underline ml-2 font-bold"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* Quick Manufacturer Filter Chips */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
            <span className="text-slate-400 text-xs font-bold mr-1">제조사:</span>
            {mfrFilterOptions.map((mfr) => (
              <button
                key={mfr.key}
                onClick={() => {
                  setSelectedMfr(mfr.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                  selectedMfr === mfr.key
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{mfr.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  selectedMfr === mfr.key ? 'bg-purple-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {mfr.count}대
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. BATCH ACTION BAR (When items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-purple-900 text-white rounded-3xl p-5 shadow-lg border border-purple-800 flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center space-x-3 text-sm font-bold">
            <span className="w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center font-mono text-xs font-black">
              {selectedIds.length}
            </span>
            <span>개의 기기가 선택되었습니다.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => handleBatchStatus('normal')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>정상으로 일괄 변경</span>
            </button>
            <button
              onClick={() => handleBatchStatus('repair')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>수리중으로 일괄 변경</span>
            </button>
            <button
              onClick={() => handleBatchStatus('broken')}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>고장으로 일괄 변경</span>
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-rose-300 rounded-xl font-bold transition-colors flex items-center gap-1.5 border border-rose-500/30"
            >
              <Trash2 className="w-4 h-4" />
              <span>삭제</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 text-purple-200 hover:text-white underline font-bold"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {/* 3. DEVICE DATA TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-purple-900 focus:outline-none"
                    title="현재 페이지 전체 선택"
                  >
                    {isAllCurrentSelected ? (
                      <CheckSquare className="w-4 h-4 text-purple-900" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th 
                  className={`py-3 px-3 cursor-pointer transition-colors whitespace-nowrap min-w-[110px] ${
                    sortBy === 'location' ? 'bg-purple-100/60 text-purple-950 font-black' : 'hover:bg-slate-100/70'
                  }`}
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>보관 장소</span>
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'location' ? 'text-purple-900' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th 
                  className={`py-3 px-3 w-20 text-center cursor-pointer transition-colors whitespace-nowrap ${
                    sortBy === 'classDeviceNumber' ? 'bg-purple-100/60 text-purple-950 font-black' : 'hover:bg-slate-100/70'
                  }`}
                  onClick={() => handleSort('classDeviceNumber')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>반 번호</span>
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'classDeviceNumber' ? 'text-purple-900' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th 
                  className={`py-3 px-3 cursor-pointer transition-colors whitespace-nowrap min-w-[130px] ${
                    sortBy === 'managementNumber' ? 'bg-purple-100/60 text-purple-950 font-black' : 'hover:bg-slate-100/70'
                  }`}
                  onClick={() => handleSort('managementNumber')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>관리번호</span>
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'managementNumber' ? 'text-purple-900' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[80px]">기기종류</th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">기기명</th>
                <th 
                  className={`py-3 px-3 cursor-pointer transition-colors whitespace-nowrap min-w-[90px] ${
                    sortBy === 'status' ? 'bg-purple-100/60 text-purple-950 font-black' : 'hover:bg-slate-100/70'
                  }`}
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>상태</span>
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'status' ? 'text-purple-900' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[180px]">고장/수리 내용</th>
                <th className="py-3 px-3 text-right whitespace-nowrap w-24">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDevices.map((device) => {
                const isSelected = selectedIds.includes(device.id);
                const badge = getStatusBadgeStyle(device.status);

                return (
                  <tr
                    key={device.id}
                    className={`hover:bg-purple-50/40 transition-colors cursor-pointer ${
                      isSelected ? 'bg-purple-50/60' : ''
                    }`}
                    onClick={() => onSelectDevice(device)}
                  >
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleSelect(device.id)}
                        className="text-slate-400 hover:text-purple-900 focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-purple-900" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* 1. Location */}
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-950 font-black border border-purple-100 text-xs whitespace-nowrap inline-block">
                        {device.location}
                      </span>
                    </td>

                    {/* 2. Class Device Number */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {device.classDeviceNumber !== undefined ? (
                        <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-xl bg-purple-100 text-purple-950 border border-purple-200/80 font-black text-xs">
                          {device.classDeviceNumber}번
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>

                    {/* 3. Management Number */}
                    <td className="py-3 px-3 font-mono font-bold text-purple-950 text-xs whitespace-nowrap">
                      {device.managementNumber ? (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-mono font-bold inline-block">
                          {device.managementNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic text-[11px]">미입력</span>
                      )}
                    </td>

                    {/* 4. Device Type */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] whitespace-nowrap inline-block">
                        {getDeviceTypeLabel(device.deviceType)}
                      </span>
                    </td>

                    {/* 5. Device Name */}
                    <td className="py-3 px-3 text-slate-900 font-bold whitespace-nowrap">
                      <span className="whitespace-nowrap block">{device.deviceName}</span>
                    </td>

                    {/* 6. Status Badge / Button */}
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

                    {/* 7. Issues / Repair Notes (Next to Status) */}
                    <td className="py-3 px-3 text-xs font-medium" onClick={(e) => e.stopPropagation()}>
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
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* 8. Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onSelectDevice(device)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors whitespace-nowrap text-xs"
                        >
                          상세
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeviceToDelete(device);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 cursor-pointer"
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

        {/* Empty State */}
        {filteredDevices.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-black text-slate-700">조건에 맞는 기기가 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">검색어나 필터 조건을 변경해 보세요.</p>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredDevices.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-3">
              <span>
                전체 <strong className="text-purple-950 font-black">{filteredDevices.length}</strong>개 중 {Math.min(filteredDevices.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredDevices.length, itemsPerPage >= 99999 ? filteredDevices.length : currentPage * itemsPerPage)} 표시
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-slate-400 font-bold">페이지당:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-purple-900 focus:outline-none"
                >
                  <option value={25}>25개씩</option>
                  <option value={50}>50개씩</option>
                  <option value={100}>100개씩</option>
                  <option value={999999}>전체보기</option>
                </select>
              </div>
            </div>

            {itemsPerPage < 99999 && (
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-bold"
                >
                  이전
                </button>
                <span className="px-3 font-mono font-black text-slate-900">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-bold"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STATUS EDIT MODAL (상태 변경 및 고장원인/수리내용 작성) */}
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
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-900 text-white font-black hover:bg-purple-800 shadow-sm cursor-pointer"
                >
                  상태 및 내용 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE DEVICE DELETE MODAL */}
      {deviceToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">기기 삭제 확인</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">선택하신 기기를 시스템에서 영구 삭제합니다.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">기기명</span>
                <span className="font-black text-slate-900">{deviceToDelete.deviceName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">보관 장소</span>
                <span className="font-black text-slate-900">
                  {deviceToDelete.location} {deviceToDelete.classDeviceNumber ? `${deviceToDelete.classDeviceNumber}번` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">관리번호</span>
                <span className="font-mono font-black text-purple-950">{deviceToDelete.managementNumber || '(미지정)'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">현재 상태</span>
                <span className="font-bold text-slate-800">
                  {deviceToDelete.status === 'normal' ? '정상' : deviceToDelete.status === 'repair' ? '수리중' : '고장'}
                </span>
              </div>
            </div>

            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>삭제 시 해당 기기의 모든 이력이 영구 제거되며, 로컬 및 클라우드(Firestore) 데이터베이스에서 즉시 동기화 삭제됩니다.</span>
            </p>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeviceToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>기기 영구 삭제</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH DELETE CONFIRMATION MODAL */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">선택 기기 일괄 삭제 확인</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  선택한 <strong className="text-rose-600 font-black">{selectedIds.length}개</strong>의 기기를 영구 삭제합니다.
                </p>
              </div>
            </div>

            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3.5 rounded-xl border border-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>선택하신 {selectedIds.length}개 기기 데이터 및 관련 수리 이력이 모두 영구 삭제됩니다. 계속 진행하시겠습니까?</span>
            </p>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>선택한 {selectedIds.length}개 기기 삭제</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH STATUS CHANGE MODAL */}
      {batchStatusTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">선택 기기 일괄 상태 변경</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  선택한 <strong className="text-purple-950 font-black">{selectedIds.length}개</strong>의 기기 상태를 변경합니다.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">대상 기기 수</span>
                <span className="font-black text-slate-900">{selectedIds.length}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">변경할 상태</span>
                <span className="font-black text-purple-900">
                  {batchStatusTarget === 'normal' ? '정상' : batchStatusTarget === 'repair' ? '수리중' : '고장'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setBatchStatusTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchStatus}
                className="px-5 py-2.5 rounded-xl bg-purple-900 text-white text-xs font-black hover:bg-purple-800 shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>일괄 변경 적용</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION TOAST */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}
    </div>
  );
};
