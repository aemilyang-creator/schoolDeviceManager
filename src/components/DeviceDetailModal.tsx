import React, { useState, useEffect } from 'react';
import { 
  X, 
  Laptop, 
  Mouse, 
  Headphones, 
  AlertTriangle, 
  Save, 
  Clock, 
  Wrench,
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { Device } from '../types';
import { getStatusBadgeStyle, formatDate, getDeviceTypeLabel } from '../utils/formatters';

interface DeviceDetailModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

const CHROMEBOOK_MFR_OPTIONS = [
  { id: '삼성전자', label: '삼성전자', defaultName: '삼성전자 크롬북' },
  { id: 'LG', label: 'LG', defaultName: 'LG 크롬북' },
  { id: '레노버', label: '레노버', defaultName: '레노버 크롬북' },
  { id: 'ASUS', label: 'ASUS', defaultName: 'ASUS 크롬북' },
  { id: '기타', label: '기타', defaultName: '기타 크롬북' },
];

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  isOpen,
  onClose,
}) => {
  const { updateDevice } = useDevices();

  const [location, setLocation] = useState<string>('');
  const [managementNumber, setManagementNumber] = useState<string>('');
  const [classDeviceNumber, setClassDeviceNumber] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('');
  const [manufacturer, setManufacturer] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [repairDescription, setRepairDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [actionReason, setActionReason] = useState<string>('');

  useEffect(() => {
    if (device) {
      setLocation(device.location);
      setManagementNumber(device.managementNumber || '');
      setClassDeviceNumber(device.classDeviceNumber !== undefined ? String(device.classDeviceNumber) : '');
      setDeviceName(device.deviceName);
      setManufacturer(device.manufacturer || '');
      
      // 기기 메모(선택) 기본 빈칸 처리 (이전 프리셋 모델명 등 자동 채움 방지)
      const rawMemo = (device.modelName || '').trim();
      const isPreset = [
        'Galaxy Chromebook 2 360',
        'LG Chromebook 11T90N',
        'Lenovo 300e Yoga Chromebook Gen 4',
        'ASUS Chromebook Flip CR1 (CR1100)',
      ].some(p => rawMemo.includes(p) || p.includes(rawMemo));

      setModelName(isPreset ? '' : rawMemo);
      setIssueDescription(device.issueDescription || '');
      setRepairDescription(device.repairDescription || '');
      setNote(device.note || '');
      setActionReason('');
    }
  }, [device]);

  if (!isOpen || !device) return null;

  const currentBadge = getStatusBadgeStyle(device.status);

  const handleSelectManufacturerOption = (mfrId: string, defaultName: string) => {
    setManufacturer(mfrId);
    setDeviceName(defaultName);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedClassNum = classDeviceNumber.trim() ? parseInt(classDeviceNumber.replace(/[^0-9]/g, ''), 10) : undefined;

    updateDevice(
      device.id,
      {
        managementNumber: managementNumber.trim(),
        classDeviceNumber: !isNaN(parsedClassNum as number) ? parsedClassNum : undefined,
        deviceName,
        manufacturer,
        modelName,
        location,
        status: device.status,
        issueDescription: device.status !== 'normal' ? issueDescription : undefined,
        repairDescription: device.status === 'repair' ? repairDescription : device.repairDescription,
        note,
      },
      actionReason || '기기 상세 정보 수정'
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-purple-900 text-white px-8 py-5 flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-800 flex items-center justify-center border border-purple-700">
              {device.deviceType === 'chromebook' ? (
                <Laptop className="w-5 h-5 text-purple-200" />
              ) : device.deviceType === 'mouse' ? (
                <Mouse className="w-5 h-5 text-purple-200" />
              ) : (
                <Headphones className="w-5 h-5 text-purple-200" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                {device.classDeviceNumber !== undefined && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-950">
                    {device.location} {device.classDeviceNumber}번
                  </span>
                )}
                <span className="font-mono text-sm font-black text-purple-200 tracking-wider">
                  {device.managementNumber ? `[관리번호: ${device.managementNumber}]` : '[관리번호: 미입력]'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-800 text-purple-200 border border-purple-700">
                  {getDeviceTypeLabel(device.deviceType)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-purple-200 mt-0.5">
                {device.deviceName} 상세 정보
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="device-detail-form" onSubmit={handleSave} className="p-8 overflow-y-auto space-y-5 text-xs">
          {/* Status Indicator Banner (Read-only status display) */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${currentBadge.bg}`}>
            <div className="flex items-center space-x-2.5">
              <span className={`w-3 h-3 rounded-full ${currentBadge.dot}`} />
              <span className="font-black text-sm">
                현재 기기 상태: {currentBadge.text}
              </span>
            </div>
            <span className="text-[11px] font-bold opacity-90 font-mono">
              최종 수정일: {formatDate(device.updatedAt)}
            </span>
          </div>

          {/* Issue & Repair Description (Display / Note) */}
          {device.status === 'broken' && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 animate-fade-in">
              <label className="block text-rose-950 font-black flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>고장 내용 및 증상</span>
              </label>
              <textarea
                rows={2}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="고장 증상 메모"
                className="w-full p-3 text-xs border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
              />
            </div>
          )}

          {device.status === 'repair' && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-fade-in">
              <label className="block text-amber-950 font-black flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>수리 접수 내용 및 진행 현황</span>
              </label>
              <textarea
                rows={2}
                value={repairDescription}
                onChange={(e) => setRepairDescription(e.target.value)}
                placeholder="수리 접수 메모"
                className="w-full p-3 text-xs border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
              />
            </div>
          )}

          {/* Basic Device Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
            <div>
              <label className="block text-purple-950 font-black mb-1">
                학급 내 반 번호 (1번~20번)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={classDeviceNumber}
                onChange={(e) => setClassDeviceNumber(e.target.value)}
                placeholder="예: 1"
                className="w-full px-3.5 py-2.5 text-xs border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-black text-purple-950 bg-white"
              />
            </div>

            <div>
              <label className="block text-purple-950 font-black mb-1">
                학교 자산 관리번호 (추후 입력 가능)
              </label>
              <input
                type="text"
                value={managementNumber}
                onChange={(e) => setManagementNumber(e.target.value)}
                placeholder="미입력 (예: CB-0102, 2026-초등-01 등)"
                className="w-full px-3.5 py-2.5 text-xs border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-mono font-bold text-purple-900 bg-white"
              />
            </div>
          </div>

          {/* Device Type / Manufacturer Selector (5 Options) */}
          <div className="space-y-2">
            <label className="block text-slate-900 font-bold">
              제조사 / 크롬북 종류 <span className="text-purple-900 font-bold">(선택 시 기기명이 자동 변경됩니다)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CHROMEBOOK_MFR_OPTIONS.map((opt) => {
                const isSelected = manufacturer === opt.id || (opt.id === 'LG' && manufacturer === 'LG전자');
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectManufacturerOption(opt.id, opt.defaultName)}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-900 font-bold mb-1">기기명</label>
              <input
                type="text"
                required
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-900 font-bold mb-1">보관 장소 (학급/특별실)</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-black text-purple-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-900 font-bold mb-1">
                기기 메모 <span className="text-slate-400 font-normal">(선택)</span>
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="예: 2024년 구입, 터치펜 포함 등"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-900 font-bold mb-1">비고</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 학생 번호 스티커 부착, 케이스 포함"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Change Log / Action Reason Note */}
          <div>
            <label className="block text-slate-900 font-bold mb-1">
              수정 사유 (이력 저장용)
            </label>
            <input
              type="text"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="예: 기기 정보 수정"
              className="w-full px-3.5 py-2.5 text-xs border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none bg-purple-50/40 font-medium"
            />
          </div>

          {/* Maintenance History Log */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-900" />
              <span>기기 상태 변경 및 조치 이력</span>
            </h4>

            {(!device.history || device.history.length === 0) ? (
              <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-400 text-[11px] font-medium">
                기록된 변경 이력이 없습니다.
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {device.history.map((hist) => {
                  const histBadge = getStatusBadgeStyle(hist.newStatus);
                  return (
                    <div
                      key={hist.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between text-[11px]"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${histBadge.bg}`}>
                            {histBadge.text}
                          </span>
                          <span className="font-bold text-slate-900">{hist.description}</span>
                        </div>
                        <div className="text-slate-500 text-[10px]">
                          처리자: {hist.userName || '디지털 튜터'}
                        </div>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-2">
                        {hist.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
          >
            닫기
          </button>
          <button
            type="submit"
            form="device-detail-form"
            className="px-6 py-2 text-xs font-black text-white bg-purple-900 hover:bg-purple-800 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>변경 사항 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};
