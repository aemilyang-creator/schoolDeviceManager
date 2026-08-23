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
  RefreshCw
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
  const { devices, deleteDevice, deleteMultipleDevices, batchUpdateStatus } = useDevices();

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | DeviceType>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | DeviceStatus>('all');
  const [selectedMfr, setSelectedMfr] = useState<'all' | string>('all');
  const [selectedLocation, setSelectedLocation] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<'managementNumber' | 'updatedAt' | 'location' | 'status'>('managementNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 25;

  // Extract all unique locations and manufacturers
  const allLocations = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => set.add(d.location));
    return Array.from(set).sort();
  }, [devices]);

  const allManufacturers = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      if (d.manufacturer) set.add(d.manufacturer);
    });
    return Array.from(set).sort();
  }, [devices]);

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
      const matchMfr = selectedMfr === 'all' || d.manufacturer === selectedMfr;
      const matchLoc = selectedLocation === 'all' || d.location === selectedLocation;

      return matchSearch && matchType && matchStatus && matchMfr && matchLoc;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'managementNumber') {
        const numA = a.classDeviceNumber !== undefined ? a.classDeviceNumber : parseInt((a.managementNumber.match(/\d+/) || ['999999'])[0], 10);
        const numB = b.classDeviceNumber !== undefined ? b.classDeviceNumber : parseInt((b.managementNumber.match(/\d+/) || ['999999'])[0], 10);
        if (numA !== numB) {
          comparison = numA - numB;
        } else {
          comparison = a.managementNumber.localeCompare(b.managementNumber);
        }
      } else if (sortBy === 'location') {
        comparison = a.location.localeCompare(b.location);
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
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDevices.slice(start, start + itemsPerPage);
  }, [filteredDevices, currentPage]);

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
    const count = selectedIds.length;
    const statusText = status === 'normal' ? '정상' : status === 'repair' ? '수리 중' : '고장';
    if (window.confirm(`선택한 ${count}개 기기의 상태를 [${statusText}](으)로 일괄 변경하시겠습니까?`)) {
      batchUpdateStatus(selectedIds, status, `일괄 상태 변경 (${statusText})`);
      setSelectedIds([]);
    }
  };

  // Batch Delete
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (window.confirm(`선택한 ${count}개 기기를 영구 삭제하시겠습니까?`)) {
      deleteMultipleDevices(selectedIds);
      setSelectedIds([]);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['관리번호', '기기종류', '기기명', '제조사', '모델명', '보관장소', '상태', '고장내용', '수리내용', '등록일', '수정일', '비고'];
    const rows = filteredDevices.map((d) => [
      d.managementNumber,
      getDeviceTypeLabel(d.deviceType),
      d.deviceName,
      d.manufacturer || '',
      d.modelName || '',
      d.location,
      d.status === 'normal' ? '정상' : d.status === 'repair' ? '수리중' : '고장',
      d.issueDescription ? `"${d.issueDescription.replace(/"/g, '""')}"` : '',
      d.repairDescription ? `"${d.repairDescription.replace(/"/g, '""')}"` : '',
      d.createdAt || '',
      d.updatedAt || '',
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

  const handleSort = (field: 'managementNumber' | 'updatedAt' | 'location' | 'status') => {
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
            <div className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Device Catalog</div>
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
            <button
              onClick={onOpenRegisterModal}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-black shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>새 기기 등록</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-900 bg-white font-bold text-slate-700"
            >
              <option value="all">기기 종류 (전체)</option>
              <option value="chromebook">크롬북 (Chromebook)</option>
              <option value="mouse">마우스 (Mouse)</option>
              <option value="earphone">이어폰 (Earphone)</option>
            </select>
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
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-xs font-bold">제조사:</span>
            {['all', '삼성전자', 'LG전자', '레노버', 'ASUS'].map((mfr) => (
              <button
                key={mfr}
                onClick={() => {
                  setSelectedMfr(mfr);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  selectedMfr === mfr
                    ? 'bg-purple-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {mfr === 'all' ? '전체' : mfr}
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
                <th className="py-4 px-4 w-12 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-purple-900 focus:outline-none"
                    title="현재 페이지 전체 선택"
                  >
                    {isAllCurrentSelected ? (
                      <CheckSquare className="w-5 h-5 text-purple-900" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th 
                  className="py-4 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors"
                  onClick={() => handleSort('managementNumber')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>관리번호</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-4 px-4">기기종류</th>
                <th className="py-4 px-4">기기명 / 제조사</th>
                <th 
                  className="py-4 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>보관 장소</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-4 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>상태</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-4 px-5">고장/수리 내용</th>
                <th 
                  className="py-4 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors"
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>최종 수정일</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-4 px-4 text-right">작업</th>
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
                    <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleSelect(device.id)}
                        className="text-slate-400 hover:text-purple-900 focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-purple-900" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-4 font-mono font-black text-purple-950 text-sm">
                      <div className="flex items-center space-x-2">
                        {device.classDeviceNumber !== undefined && (
                          <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-950 font-bold text-xs">
                            {device.classDeviceNumber}번
                          </span>
                        )}
                        {device.managementNumber ? (
                          <span>{device.managementNumber}</span>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-xs">미입력</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px]">
                        {getDeviceTypeLabel(device.deviceType)}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-800">
                      <div className="font-black text-slate-900">{device.deviceName}</div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {device.manufacturer} {device.modelName ? `· ${device.modelName}` : ''}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-800">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold">
                        {device.location}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.text}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-slate-600 max-w-xs truncate font-medium">
                      {device.issueDescription ? (
                        <span className="text-rose-700 font-bold truncate">{device.issueDescription}</span>
                      ) : device.repairDescription ? (
                        <span className="text-amber-700 font-bold truncate">{device.repairDescription}</span>
                      ) : device.note ? (
                        <span className="text-slate-500 truncate">{device.note}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-500 font-mono font-medium">
                      {formatDate(device.updatedAt)}
                    </td>

                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onSelectDevice(device)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl font-bold transition-colors"
                        >
                          상세 / 변경
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`${device.managementNumber} 기기를 삭제하시겠습니까?`)) {
                              deleteDevice(device.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="삭제"
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
            <div>
              전체 {filteredDevices.length}개 중 {Math.min(filteredDevices.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredDevices.length, currentPage * itemsPerPage)} 표시
            </div>

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
          </div>
        )}
      </div>
    </div>
  );
};
