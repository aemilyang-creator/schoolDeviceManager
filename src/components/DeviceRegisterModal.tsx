import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Laptop, 
  Mouse, 
  Headphones, 
  CheckCircle2, 
  Layers,
  Sparkles
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { DeviceType, DeviceStatus, Manufacturer, MouseType } from '../types';

interface DeviceRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocation?: string;
}

const CHROMEBOOK_MFR_LIST = [
  { id: '삼성전자', label: '삼성전자', defaultName: '삼성전자 크롬북' },
  { id: 'LG', label: 'LG', defaultName: 'LG 크롬북' },
  { id: '레노버', label: '레노버', defaultName: '레노버 크롬북' },
  { id: 'ASUS', label: 'ASUS', defaultName: 'ASUS 크롬북' },
  { id: '기타', label: '기타', defaultName: '기타 크롬북' },
];

export const DeviceRegisterModal: React.FC<DeviceRegisterModalProps> = ({
  isOpen,
  onClose,
  defaultLocation = '3학년 1반',
}) => {
  const { addDevice, batchAddDevices, devices } = useDevices();

  const [mode, setMode] = useState<'single' | 'batch'>('single');

  // Single Device Form State
  const [deviceType, setDeviceType] = useState<DeviceType>('chromebook');
  const [classDeviceNumber, setClassDeviceNumber] = useState<string>('');
  const [managementNumber, setManagementNumber] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('삼성전자 크롬북');
  const [manufacturer, setManufacturer] = useState<string>('삼성전자');
  const [modelName, setModelName] = useState<string>('');
  const [mouseType, setMouseType] = useState<MouseType>('wireless');
  const [location, setLocation] = useState<string>(defaultLocation);
  const [status, setStatus] = useState<DeviceStatus>('normal');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [repairDescription, setRepairDescription] = useState<string>('');
  const [note, setNote] = useState<string>('학생 배정용');

  // Batch Form State
  const [batchPrefix, setBatchPrefix] = useState<string>('CB-2026-');
  const [batchStartNum, setBatchStartNum] = useState<number>(1);
  const [batchCount, setBatchCount] = useState<number>(20);

  const handleSelectChromebookMfr = (mfrId: string, defaultName: string) => {
    setManufacturer(mfrId);
    setDeviceName(defaultName);
  };

  if (!isOpen) return null;

  // Auto suggest next management number
  const handleSuggestMgmtNum = () => {
    const cbCount = devices.filter((d) => d.deviceType === deviceType).length + 1;
    const prefix = deviceType === 'chromebook' ? 'CB' : deviceType === 'mouse' ? 'MS' : 'EP';
    setManagementNumber(`${prefix}-${String(cbCount).padStart(4, '0')}`);
  };

  const handleDeviceTypeChange = (type: DeviceType) => {
    setDeviceType(type);
    if (type === 'chromebook') {
      setDeviceName('삼성전자 크롬북');
      setManufacturer('삼성전자');
      setModelName('');
      setBatchPrefix('CB-2026-');
    } else if (type === 'mouse') {
      setDeviceName('무선 광마우스');
      setManufacturer('로지텍');
      setModelName('M185 Wireless');
      setBatchPrefix('MS-');
    } else {
      setDeviceName('에듀케이션 유선 이어폰');
      setManufacturer('ACTTO');
      setModelName('ACTTO-ED-100');
      setBatchPrefix('EP-');
    }
  };

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim() || !location.trim()) {
      alert('필수 입력 항목(기기 종류, 기기명, 보관 장소)을 모두 입력해주세요.');
      return;
    }

    const parsedClassNum = classDeviceNumber.trim() ? parseInt(classDeviceNumber.replace(/[^0-9]/g, ''), 10) : undefined;

    addDevice({
      deviceType,
      classDeviceNumber: Number.isNaN(parsedClassNum) ? undefined : parsedClassNum,
      managementNumber: managementNumber.trim(),
      deviceName: deviceName.trim(),
      manufacturer,
      modelName: modelName.trim(),
      mouseType: deviceType === 'mouse' ? mouseType : undefined,
      location: location.trim(),
      status,
      issueDescription: status !== 'normal' ? issueDescription.trim() : undefined,
      repairDescription: status === 'repair' ? repairDescription.trim() : undefined,
      note: note.trim(),
    });

    onClose();
  };

  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim() || !location.trim() || batchCount <= 0) {
      alert('일괄 등록 정보를 올바르게 입력해주세요.');
      return;
    }

    const batchList = [];
    for (let i = 0; i < batchCount; i++) {
      const currentNum = batchStartNum + i;
      const mgmtNum = `${batchPrefix}${String(currentNum).padStart(3, '0')}`;
      batchList.push({
        deviceType,
        managementNumber: mgmtNum,
        deviceName: deviceName.trim(),
        manufacturer,
        modelName: modelName.trim(),
        mouseType: deviceType === 'mouse' ? mouseType : undefined,
        location: location.trim(),
        status,
        issueDescription: status !== 'normal' ? issueDescription.trim() : undefined,
        note: note.trim(),
      });
    }

    batchAddDevices(batchList);
    onClose();
  };

  // Location suggestions
  const commonLocations = [
    '3학년 1반', '3학년 2반', '4학년 1반', '4학년 2반',
    '5학년 1반', '5학년 2반', '6학년 1반', '6학년 2반',
    '스마트실'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-purple-900 text-white px-8 py-5 flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-800 flex items-center justify-center border border-purple-700">
              <PlusCircle className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">New Device Entry</div>
              <h3 className="font-black text-lg text-white tracking-tight">신규 디지털 기기 등록</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle (Single vs Batch) */}
        <div className="px-8 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                mode === 'single'
                  ? 'bg-white text-purple-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              개별 1대 등록
            </button>
            <button
              type="button"
              onClick={() => setMode('batch')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                mode === 'batch'
                  ? 'bg-white text-purple-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              학급/수량 일괄 등록
            </button>
          </div>

          <span className="text-xs text-purple-900 font-bold">
            * 필수 입력 항목
          </span>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-8 overflow-y-auto space-y-5 text-xs">
          {/* Device Type Selection (Required) */}
          <div>
            <label className="block text-slate-900 font-bold mb-2">
              기기 종류 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleDeviceTypeChange('chromebook')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  deviceType === 'chromebook'
                    ? 'border-purple-900 bg-purple-50/80 text-purple-950 ring-2 ring-purple-900 font-black'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold'
                }`}
              >
                <Laptop className="w-6 h-6 text-purple-900" />
                <span>크롬북</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeviceTypeChange('mouse')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  deviceType === 'mouse'
                    ? 'border-purple-900 bg-purple-50/80 text-purple-950 ring-2 ring-purple-900 font-black'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold'
                }`}
              >
                <Mouse className="w-6 h-6 text-purple-900" />
                <span>마우스</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeviceTypeChange('earphone')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  deviceType === 'earphone'
                    ? 'border-purple-900 bg-purple-50/80 text-purple-950 ring-2 ring-purple-900 font-black'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold'
                }`}
              >
                <Headphones className="w-6 h-6 text-purple-900" />
                <span>이어폰</span>
              </button>
            </div>
          </div>

          {/* Form fields based on mode */}
          {mode === 'single' ? (
            <form id="single-device-form" onSubmit={handleSubmitSingle} className="space-y-4">
              {/* Class Number, Management Number & Device Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-900 font-bold mb-1">
                    반 번호 <span className="text-slate-400 font-normal">(학급 배정용)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="예: 1"
                    value={classDeviceNumber}
                    onChange={(e) => setClassDeviceNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-900 font-bold">
                      관리번호 <span className="text-slate-400 font-normal">(선택)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSuggestMgmtNum}
                      className="text-[11px] text-purple-900 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>자동 생성</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="예: CB-0731"
                    value={managementNumber}
                    onChange={(e) => setManagementNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-mono font-black"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1">
                    기기명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 삼성 갤럭시 크롬북 2"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Chromebook Manufacturer Option Buttons (When deviceType is chromebook) */}
              {deviceType === 'chromebook' && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <label className="block text-slate-900 font-black text-xs">
                    제조사 / 크롬북 종류 <span className="text-purple-900 font-bold">(옵션 원클릭 선택)</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {CHROMEBOOK_MFR_LIST.map((opt) => {
                      const isSelected = manufacturer === opt.id || (opt.id === 'LG' && manufacturer === 'LG전자');
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectChromebookMfr(opt.id, opt.defaultName)}
                          className={`py-2 px-1 text-center rounded-xl border text-[11px] font-black transition-all ${
                            isSelected
                              ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Model / Memo Note */}
              <div>
                <label className="block text-slate-900 font-bold mb-1">
                  기기 메모 / 추가 정보 <span className="text-slate-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 2024년 구입 (자유 메모 가능)"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-medium"
                />
              </div>

              {/* Location & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 font-bold mb-1">
                    보관 장소 (학급/스마트실) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="location-list"
                    placeholder="예: 3학년 1반, 스마트실"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-bold"
                  />
                  <datalist id="location-list">
                    {commonLocations.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1">
                    초기 상태 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none bg-white font-bold"
                  >
                    <option value="normal">정상 (즉시 사용 가능)</option>
                    <option value="repair">수리 중 (AS진행)</option>
                    <option value="broken">고장 (사용 불가/점검필요)</option>
                  </select>
                </div>
              </div>

              {/* Issue Description if broken */}
              {status !== 'normal' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-fade-in">
                  <label className="block text-amber-950 font-black">
                    고장/수리 내용 입력 <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="고장 증상 및 수리 요청 사항을 입력하세요 (예: 화면 깜빡임, 액정 파손)"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                  />
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-slate-900 font-bold mb-1">
                  비고 / 특이사항
                </label>
                <input
                  type="text"
                  placeholder="예: 2026학년도 신규 도입분, 번호스티커 부착"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-medium"
                />
              </div>
            </form>
          ) : (
            /* Batch Registration Form */
            <form id="batch-device-form" onSubmit={handleSubmitBatch} className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-purple-950 text-xs leading-relaxed">
                <span className="font-black flex items-center gap-1.5 mb-1 text-purple-900">
                  <Layers className="w-4 h-4 text-purple-900" />
                  일괄 기기 생성 안내
                </span>
                학급 단위로 연속된 관리번호를 일괄 생성하여 한 번에 등록합니다.
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-900 font-bold mb-1">
                    관리번호 접두사
                  </label>
                  <input
                    type="text"
                    required
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value)}
                    placeholder="예: CB-301-"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1">
                    시작 번호
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={batchStartNum}
                    onChange={(e) => setBatchStartNum(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1">
                    생성 수량 (대)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={batchCount}
                    onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-mono font-black text-purple-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 font-bold mb-1">
                    배정 보관 장소 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="location-list"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1">
                    기기명
                  </label>
                  <input
                    type="text"
                    required
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Chromebook Manufacturer Option Buttons (Batch Mode) */}
              {deviceType === 'chromebook' && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <label className="block text-slate-900 font-black text-xs">
                    제조사 / 크롬북 종류 <span className="text-purple-900 font-bold">(옵션 원클릭 선택)</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {CHROMEBOOK_MFR_LIST.map((opt) => {
                      const isSelected = manufacturer === opt.id || (opt.id === 'LG' && manufacturer === 'LG전자');
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectChromebookMfr(opt.id, opt.defaultName)}
                          className={`py-2 px-1 text-center rounded-xl border text-[11px] font-black transition-all ${
                            isSelected
                              ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-900 font-bold mb-1">
                  기기 메모 / 추가 정보 <span className="text-slate-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="예: 2024년 구입 등"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-medium"
                />
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            form={mode === 'single' ? 'single-device-form' : 'batch-device-form'}
            className="px-6 py-2 text-xs font-black text-white bg-purple-900 hover:bg-purple-800 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{mode === 'single' ? '기기 등록 완료' : `${batchCount}대 일괄 등록`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
