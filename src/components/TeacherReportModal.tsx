import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  School, 
  Calendar, 
  Laptop, 
  Mouse, 
  Headphones, 
  AlertTriangle,
  Download,
  Share2
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { formatDate } from '../utils/formatters';

interface TeacherReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherReportModal: React.FC<TeacherReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { stats, devices, consumables, systemConfig } = useDevices();
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const brokenDevices = devices.filter((d) => d.status === 'broken');
  const repairDevices = devices.filter((d) => d.status === 'repair');
  const requestedConsumables = consumables.filter((c) => c.requestMemo && c.requestMemo.trim() !== '');

  // Generate plain text report for school messenger / CoolMessenger
  const generateMessengerReport = () => {
    const lgTotal = (stats.chromebook.byManufacturer['LG']?.total || 0) + (stats.chromebook.byManufacturer['LG전자']?.total || 0);
    return `[${systemConfig.schoolName} 디지털기기 현황 보고서]
■ 보고일자: ${dateStr}
■ 작성자: ${systemConfig.digitalTutorName}
■ 확인자: ${systemConfig.deviceTeacherName}

1. 크롬북 현황 (학생용)
 - 총 보유 수량: ${stats.chromebook.total}대
 - 정상 작동(사용 가능): ${stats.chromebook.normal}대 (${stats.chromebook.operationalRate}%)
 - 수리 진행 중: ${stats.chromebook.repair}대
 - 고장(사용 불가): ${stats.chromebook.broken}대
 - 제조사별: 삼성전자 ${stats.chromebook.byManufacturer['삼성전자']?.total || 0}대, LG ${lgTotal}대, 레노버 ${stats.chromebook.byManufacturer['레노버']?.total || 0}대, ASUS ${stats.chromebook.byManufacturer['ASUS']?.total || 0}대

2. 소모품 현황
 - 마우스: 총 ${stats.mouse.total}개 (유선 ${stats.mouse.wired}개 / 무선 ${stats.mouse.wireless}개, 예비 ${stats.mouse.spare}개)
 - 이어폰: 총 ${stats.earphone.total}개 (배정 ${stats.earphone.assigned}개, 예비 ${stats.earphone.spare}개)

3. 주요 고장 및 수리 요청 (${brokenDevices.length + repairDevices.length}건)
${brokenDevices.slice(0, 5).map((d) => ` • [${d.managementNumber}] ${d.location} / ${d.deviceName} - ${d.issueDescription || '증상 미입력'}`).join('\n')}
${brokenDevices.length > 5 ? ` • 외 ${brokenDevices.length - 5}건 추가 접수됨\n` : ''}

4. 학급별 소모품 교체 요청 사항
${requestedConsumables.map((c) => ` • [${c.location}] ${c.requestMemo}`).join('\n') || ' • 특이 요청 사항 없음'}

※ 자세한 사항은 학교 디지털기기 관리 시스템 웹앱에서 확인하실 수 있습니다.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMessengerReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Header - Hidden during print */}
        <div className="bg-purple-900 text-white px-8 py-5 flex items-center justify-between border-b border-purple-800 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-800 flex items-center justify-center border border-purple-700">
              <FileText className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Official Report</div>
              <h3 className="font-black text-lg text-white tracking-tight">디지털기기 담당 교사 보고서</h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-xl text-xs font-black border border-purple-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '메신저 텍스트 복사됨!' : '메신저 복사'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white text-purple-950 hover:bg-slate-100 rounded-xl text-xs font-black transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-purple-950" />
              <span>인쇄 / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-800 font-sans print:p-6 print:overflow-visible text-xs leading-normal">
          {/* Document Formal Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-block px-3 py-1 rounded-lg bg-purple-100 text-purple-950 font-black text-[11px] mb-2 uppercase tracking-wide">
                {systemConfig.academicYear} 학사 보고
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                디지털기기 관리 및 가동 현황 보고서
              </h1>
              <p className="text-slate-600 text-xs mt-1.5 font-medium">
                학교명: <span className="font-bold text-slate-950">{systemConfig.schoolName}</span> | 기준일자: <span className="font-bold text-slate-950">{dateStr}</span>
              </p>
            </div>

            {/* Approval Table */}
            <div className="border border-slate-400 rounded-xl overflow-hidden text-center shrink-0">
              <table className="text-xs border-collapse">
                <tbody>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold">
                    <td className="px-4 py-1.5 border-r border-slate-300">작성 (디지털 튜터)</td>
                    <td className="px-4 py-1.5">확인 (담당 교사)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-r border-slate-300 font-bold text-slate-800">{systemConfig.digitalTutorName} (서명)</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{systemConfig.deviceTeacherName} (인)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-purple-950 flex items-center gap-2 pb-1.5 border-b border-purple-200">
              <span className="w-2 h-4 bg-purple-900 rounded-xs inline-block" />
              1. 전체 기기 총괄 현황
            </h3>

            <div className="grid grid-cols-3 gap-3.5 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="text-xs text-slate-500 font-bold">크롬북 정상 가동률</div>
                <div className="text-2xl font-black text-purple-950 font-mono mt-1">
                  {stats.chromebook.operationalRate}%
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                  {stats.chromebook.normal}대 / {stats.chromebook.total}대
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="text-xs text-slate-500 font-bold">수리 및 고장 대기</div>
                <div className="text-2xl font-black text-rose-700 font-mono mt-1">
                  {stats.chromebook.repair + stats.chromebook.broken}대
                </div>
                <div className="text-[11px] text-slate-600 font-bold mt-0.5">
                  수리 {stats.chromebook.repair}대 · 고장 {stats.chromebook.broken}대
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="text-xs text-slate-500 font-bold">소모품 (마우스/이어폰)</div>
                <div className="text-2xl font-black text-indigo-950 font-mono mt-1">
                  {stats.mouse.total + stats.earphone.total}개
                </div>
                <div className="text-[11px] text-slate-600 font-bold mt-0.5">
                  마우스 {stats.mouse.total}개 · 이어폰 {stats.earphone.total}개
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Detailed Table */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-purple-950 flex items-center gap-2 pb-1.5 border-b border-purple-200">
              <span className="w-2 h-4 bg-purple-900 rounded-xs inline-block" />
              2. 품목별 세부 보유 및 가동 내역
            </h3>

            <table className="w-full text-left border-collapse border border-slate-300 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <th className="p-2.5 border border-slate-300">구분</th>
                  <th className="p-2.5 border border-slate-300">총 보유수량</th>
                  <th className="p-2.5 border border-slate-300">정상 작동</th>
                  <th className="p-2.5 border border-slate-300">수리 중</th>
                  <th className="p-2.5 border border-slate-300">고장</th>
                  <th className="p-2.5 border border-slate-300">세부 분류 및 비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-black bg-slate-50 border border-slate-300">크롬북</td>
                  <td className="p-2.5 font-mono font-black border border-slate-300">{stats.chromebook.total}대</td>
                  <td className="p-2.5 font-mono text-emerald-700 font-black border border-slate-300">{stats.chromebook.normal}대</td>
                  <td className="p-2.5 font-mono text-amber-700 font-black border border-slate-300">{stats.chromebook.repair}대</td>
                  <td className="p-2.5 font-mono text-rose-700 font-black border border-slate-300">{stats.chromebook.broken}대</td>
                  <td className="p-2.5 text-slate-700 font-medium border border-slate-300">
                    삼성({stats.chromebook.byManufacturer['삼성전자']?.total || 0}), LG({stats.chromebook.byManufacturer['LG전자']?.total || 0}), 레노버({stats.chromebook.byManufacturer['레노버']?.total || 0}), ASUS({stats.chromebook.byManufacturer['ASUS']?.total || 0})
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-black bg-slate-50 border border-slate-300">마우스</td>
                  <td className="p-2.5 font-mono font-black border border-slate-300">{stats.mouse.total}개</td>
                  <td className="p-2.5 font-mono border border-slate-300 font-bold">{stats.mouse.total}개</td>
                  <td className="p-2.5 font-mono border border-slate-300">0개</td>
                  <td className="p-2.5 font-mono border border-slate-300">0개</td>
                  <td className="p-2.5 text-slate-700 font-medium border border-slate-300">
                    유선 {stats.mouse.wired}개, 무선 {stats.mouse.wireless}개 (예비 {stats.mouse.spare}개)
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-black bg-slate-50 border border-slate-300">이어폰</td>
                  <td className="p-2.5 font-mono font-black border border-slate-300">{stats.earphone.total}개</td>
                  <td className="p-2.5 font-mono border border-slate-300 font-bold">{stats.earphone.assigned}개</td>
                  <td className="p-2.5 font-mono border border-slate-300">0개</td>
                  <td className="p-2.5 font-mono border border-slate-300">0개</td>
                  <td className="p-2.5 text-slate-700 font-medium border border-slate-300">
                    학급 배정 {stats.earphone.assigned}개 (예비 {stats.earphone.spare}개)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Issues and Repair Queue */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-purple-950 flex items-center gap-2 pb-1.5 border-b border-purple-200">
              <span className="w-2 h-4 bg-purple-900 rounded-xs inline-block" />
              3. 기기 고장 접수 및 수리 조치 내역 ({brokenDevices.length + repairDevices.length}건)
            </h3>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">관리번호</th>
                    <th className="p-2.5">보관장소</th>
                    <th className="p-2.5">기기명/제조사</th>
                    <th className="p-2.5">상태</th>
                    <th className="p-2.5">고장 증상 및 조치 계획</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {brokenDevices.concat(repairDevices).slice(0, 10).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-black text-slate-900">{d.managementNumber}</td>
                      <td className="p-2.5 font-bold text-slate-800">{d.location}</td>
                      <td className="p-2.5 font-medium">{d.deviceName} ({d.manufacturer})</td>
                      <td className="p-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          d.status === 'repair' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}>
                          {d.status === 'repair' ? '수리 중' : '고장'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-700 font-medium">
                        {d.issueDescription || d.repairDescription || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Consumables Classroom Requests */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-purple-950 flex items-center gap-2 pb-1.5 border-b border-purple-200">
              <span className="w-2 h-4 bg-purple-900 rounded-xs inline-block" />
              4. 학급별 소모품 요청 및 건의 사항
            </h3>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              {requestedConsumables.length === 0 ? (
                <div className="text-slate-500 font-medium">접수된 특이 요청 사항이 없습니다.</div>
              ) : (
                requestedConsumables.map((c) => (
                  <div key={c.id} className="flex items-start space-x-2 text-xs">
                    <span className="font-black text-purple-950 min-w-[90px]">[{c.location}]</span>
                    <span className="text-slate-800 font-medium whitespace-pre-line break-words">{c.requestMemo}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Report Footer */}
          <div className="text-center pt-4 border-t border-slate-200 text-slate-500 text-[11px] font-medium">
            {systemConfig.schoolName} 디지털 교육환경 지원단 · 본 문서는 학교 디지털기기 관리 시스템에서 자동 출력되었습니다.
          </div>
        </div>

        {/* Modal Footer - Hidden during print */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-600 font-medium">
            학교 메신저(쿨메신저 등)에 복사하여 붙여넣으면 깔끔하게 공유됩니다.
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-black text-purple-950 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded-xl transition-colors flex items-center gap-2"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? '복사 완료!' : '메신저 텍스트 복사'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 text-xs font-black text-white bg-purple-900 hover:bg-purple-800 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>보고서 인쇄하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
