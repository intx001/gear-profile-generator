import React from 'react';
import { GearParams, GearCalculations } from '../types';
import { ShieldAlert, CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/lang';

interface StatsPanelProps {
  params: GearParams;
  calculations: GearCalculations;
  unit: 'mm' | 'inch';
  lang?: Language;
}

export default function StatsPanel({ params, calculations, unit, lang = 'zh' }: StatsPanelProps) {
  const t = TRANSLATIONS[lang];

  const formatVal = (valMm: number) => {
    if (unit === 'inch') {
      return (valMm / 25.4).toFixed(4) + ' in';
    }
    return valMm.toFixed(3) + ' mm';
  };

  // 避免根切所需的最小变位系数
  const alphaRad = (params.pressureAngle * Math.PI) / 180;
  const idealMinShift = params.addendumCoeff - (params.teeth * Math.pow(Math.sin(alphaRad), 2)) / 2;
  const recommendedShift = Math.max(0, parseFloat(idealMinShift.toFixed(3)));

  // Handle dynamic placeholders in translation string
  const renderUndercutWarningText = () => {
    let text = t.sp_warning_text;
    text = text.replace('{teeth}', params.teeth.toString());
    text = text.replace('{limit}', calculations.undercutLimit.toFixed(1));
    return text;
  };

  return (
    <div id="stats-panel" className="bg-[#0F0F12] rounded-lg border border-[#27272A] p-5 space-y-5">
      <div className="flex items-center gap-2 border-b border-[#27272A] pb-3">
        <Bookmark className="w-5 h-5 text-amber-500" />
        <h2 className="text-base font-semibold text-white">{t.sp_title}</h2>
      </div>

      {/* 根切风险检测 */}
      {calculations.hasUndercutWarning ? (
        <div className="bg-rose-950/20 border border-rose-500/25 text-rose-300 rounded-sm p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{t.sp_warning_title}</span>
          </div>
          <p className="leading-relaxed text-[#A1A1AA]">
            {renderUndercutWarningText()}
          </p>
          <div className="pt-1.5 border-t border-rose-500/10 flex flex-col gap-1 text-2xs text-rose-400 font-medium">
            <p className="font-semibold text-amber-500">{t.sp_suggestion_title}</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[#71717A]">
              <li>{t.sp_suggestion_shift}<b className="font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-sm border border-amber-500/20">{recommendedShift}</b> </li>
              <li>{t.sp_suggestion_teeth}<b className="font-mono text-white">{Math.ceil(calculations.undercutLimit)}</b></li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 rounded-sm p-3.5 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-emerald-400">{t.sp_strength_ok}</p>
            <p className="text-[#A1A1AA] leading-normal">
              {t.sp_strength_ok_desc}
            </p>
          </div>
        </div>
      )}

      {/* 核心尺寸分组表格 */}
      <div className="space-y-4">
        {/* 分组一：圆周参考半径/直径 */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#71717A] tracking-wider">{t.sp_heading_radial}</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* 齿顶圆 */}
            <div className="bg-[#141416] p-2.5 rounded-sm border border-[#27272A] flex flex-col justify-between">
              <span className="text-[#A1A1AA] flex items-center gap-1">
                {t.sp_tip_dia}
                <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title={t.sp_tip_dia_desc} />
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono mt-1">
                {formatVal(calculations.addendumDiameter)}
              </span>
            </div>

            {/* 分度圆 */}
            <div className="bg-[#141416] p-2.5 rounded-sm border border-[#27272A] flex flex-col justify-between">
              <span className="text-[#A1A1AA] flex items-center gap-1">
                {t.sp_pitch_dia}
                <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title={t.sp_pitch_dia_desc} />
              </span>
              <span className="text-sm font-bold text-sky-400 font-mono mt-1">
                {formatVal(calculations.pitchDiameter)}
              </span>
            </div>

            {/* 基圆 */}
            <div className="bg-[#141416] p-2.5 rounded-sm border border-[#27272A] flex flex-col justify-between">
              <span className="text-[#A1A1AA] flex items-center gap-1">
                {t.sp_base_dia}
                <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title={t.sp_base_dia_desc} />
              </span>
              <span className="text-sm font-bold text-amber-500 font-mono mt-1">
                {formatVal(calculations.baseDiameter)}
              </span>
            </div>

            {/* 齿根圆 */}
            <div className="bg-[#141416] p-2.5 rounded-sm border border-[#27272A] flex flex-col justify-between">
              <span className="text-[#A1A1AA] flex items-center gap-1">
                {t.sp_dedendum_dia}
                <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title={t.sp_dedendum_dia_desc} />
              </span>
              <span className="text-sm font-bold text-rose-400 font-mono mt-1">
                {formatVal(calculations.dedendumDiameter)}
              </span>
            </div>
          </div>
        </div>

        {/* 分组二：轮齿微观几何 parameters */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#71717A] tracking-wider">{t.sp_heading_micro}</h3>
          <div className="bg-[#141416] rounded-sm divide-y divide-[#27272A] text-xs border border-[#27272A] overflow-hidden">
            <div className="flex justify-between p-2.5">
              <span className="text-[#A1A1AA]">{t.sp_tooth_thickness}</span>
              <span className="font-semibold text-white font-mono">{formatVal(calculations.toothThickness)}</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-[#A1A1AA]">{t.sp_circular_pitch}</span>
              <span className="font-semibold text-white font-mono">{formatVal(calculations.pitch)}</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-[#A1A1AA]">pb {t.sp_base_pitch}</span>
              <span className="font-semibold text-white font-mono">{formatVal(calculations.basePitch)}</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-[#A1A1AA]">{t.sp_total_height}</span>
              <span className="font-semibold text-white font-mono">
                {formatVal((calculations.addendumDiameter - calculations.dedendumDiameter) / 2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
