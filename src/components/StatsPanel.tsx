import React from 'react';
import { GearParams, GearCalculations } from '../types';
import { ShieldAlert, CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';

interface StatsPanelProps {
  params: GearParams;
  calculations: GearCalculations;
  unit: 'mm' | 'inch';
}

export default function StatsPanel({ params, calculations, unit }: StatsPanelProps) {
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

  return (
    <div id="stats-panel" className="bg-[#0F0F12] rounded-lg border border-[#27272A] p-5 space-y-5">
      <div className="flex items-center gap-2 border-b border-[#27272A] pb-3">
        <Bookmark className="w-5 h-5 text-amber-500" />
        <h2 className="text-base font-semibold text-white">齿轮工程尺寸计算</h2>
      </div>

      {/* 根切风险检测 */}
      {calculations.hasUndercutWarning ? (
        <div className="bg-rose-950/20 border border-rose-500/25 text-rose-300 rounded-sm p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>⚠️ 根切风险警告 (Undercut Warning)</span>
          </div>
          <p className="leading-relaxed text-[#A1A1AA]">
            当前齿数 z = {params.teeth} 小于非变位不根切的最极限齿数 <b className="font-mono text-white">{calculations.undercutLimit.toFixed(1)}</b>。
            这会导致刀具在切入时削弱齿根弧度，减少齿根抗弯曲强度，同时降低接触传动平顺度。
          </p>
          <div className="pt-1.5 border-t border-rose-500/10 flex flex-col gap-1 text-2xs text-rose-400 font-medium">
            <p className="font-semibold text-amber-500">💡 工艺修正建议：</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[#71717A]">
              <li>设置正径向变位系数 x ≥ <b className="font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-sm border border-amber-500/20">{recommendedShift}</b> </li>
              <li>或者将齿轮齿轮齿数增加至不少于 <b className="font-mono text-white">{Math.ceil(calculations.undercutLimit)}</b></li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 rounded-sm p-3.5 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-emerald-400">齿廓强度状态：良好</p>
            <p className="text-[#A1A1AA] leading-normal">
              齿剖面避开了加工根切区，齿根肉厚度适中，能承受理想的齿向载荷强度。
            </p>
          </div>
        </div>
      )}

      {/* 核心尺寸分组表格 */}
      <div className="space-y-4">
        {/* 分组一：圆周参考半径/直径 */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#71717A] tracking-wider">● 轮廓径向圈尺寸</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* 齿顶圆 */}
            <div className="bg-[#141416] p-2.5 rounded-sm border border-[#27272A] flex flex-col justify-between">
              <span className="text-[#A1A1AA] flex items-center gap-1">
                齿顶圆直径 da
                <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title="齿轮最外层的直径圆柱面，da = d + 2 * (ha* + x) * m" />
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono mt-1">
                {formatVal(calculations.addendumDiameter)}
              </span>
            </div>

            {/* 分度圆 */}
            <div className="bg-[#141416] p-2.5 rounded-sm border border-[#27272A] flex flex-col justify-between">
              <span className="text-[#A1A1AA] flex items-center gap-1">
                分度圆直径 d
                <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title="齿轮的几何参考设计圈，d = m * z" />
              </span>
              <span className="text-sm font-bold text-sky-400 font-mono mt-1">
                {formatVal(calculations.pitchDiameter)}
              </span>
            </div>

            {/* 基圆 */}
            <div className="bg-[#141416] p-2.5 rounded-sm border border-[#27272A] flex flex-col justify-between">
              <span className="text-[#A1A1AA] flex items-center gap-1">
                基圆直径 db
                <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title="生成渐开线所包络的底圆柱面，db = d * cos(alpha)" />
              </span>
              <span className="text-sm font-bold text-amber-500 font-mono mt-1">
                {formatVal(calculations.baseDiameter)}
              </span>
            </div>

            {/* 齿根圆 */}
            <div className="bg-[#141416] p-2.5 rounded-sm border border-[#27272A] flex flex-col justify-between">
              <span className="text-[#A1A1AA] flex items-center gap-1">
                齿根圆直径 df
                <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title="轮齿槽最底侧的底面圆，df = d - 2 * (ha* + c* - x) * m" />
              </span>
              <span className="text-sm font-bold text-rose-400 font-mono mt-1">
                {formatVal(calculations.dedendumDiameter)}
              </span>
            </div>
          </div>
        </div>

        {/* 分组二：轮齿微观几何 parameters */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#71717A] tracking-wider">● 轮齿微观物理几何</h3>
          <div className="bg-[#141416] rounded-sm divide-y divide-[#27272A] text-xs border border-[#27272A] overflow-hidden">
            <div className="flex justify-between p-2.5">
              <span className="text-[#A1A1AA]">分度圆齿厚 s (Arc Thickness)</span>
              <span className="font-semibold text-white font-mono">{formatVal(calculations.toothThickness)}</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-[#A1A1AA]">端面圆周齿距 p (Circular Pitch)</span>
              <span className="font-semibold text-white font-mono">{formatVal(calculations.pitch)}</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-[#A1A1AA]">基圆齿距 pb (Base Pitch)</span>
              <span className="font-semibold text-white font-mono">{formatVal(calculations.basePitch)}</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-[#A1A1AA]">单齿高度 h (Total Tooth Height)</span>
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
