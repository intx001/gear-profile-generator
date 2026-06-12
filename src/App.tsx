import React, { useState } from 'react';
import { GearParams, MatingGearParams, RenderOptions } from './types';
import { calculateGear } from './utils/gearMath';
import ParameterPanel from './components/ParameterPanel';
import StatsPanel from './components/StatsPanel';
import GearViewer from './components/GearViewer';
import { Cog, ShieldCheck, Printer, FileDown, Layers, Columns } from 'lucide-react';
import { Language, TRANSLATIONS } from './utils/lang';

export default function App() {
  const [lang, setLang] = useState<Language>('zh');
  const t = TRANSLATIONS[lang];

  // 1. 初始化齿轮主设计参数
  const [params, setParams] = useState<GearParams>({
    modulus: 2.0,            // 模数
    teeth: 18,               // 齿 z=18
    pressureAngle: 20.0,     // 压力角 20度
    profileShift: 0.0,       // 无变位
    addendumCoeff: 1.0,      // 齿顶高系数
    clearanceCoeff: 0.25,    // 顶隙系数
    filletCoeff: 0.38,       // 齿根过渡过渡圆角
    shaftDiameter: 8.0,      // 8mm 轴孔
    hasKeyway: false,
    keywayWidth: 3.0,
    keywayDepth: 1.4,
    spokeType: 'none',
    spokesCount: 4,
    spokeRatio: 0.55,
    kerf: 0.0,               // 无补偿
  });

  // 2. 初始化啮合联动副齿轮参数
  const [matingParams, setMatingParams] = useState<MatingGearParams>({
    enabled: false,
    teeth: 24,
    profileShift: 0.0,
    addendumCoeff: 1.0,
    clearanceCoeff: 0.25,
    rotationAngle: 0.0,
  });

  // 3. 渲染开关配置
  const [renderOptions, setRenderOptions] = useState<RenderOptions>({
    showPitchCircle: true,
    showBaseCircle: true,
    showAddendumCircle: false,
    showDedendumCircle: false,
    showGrid: true,
    animate: false,
    playbackSpeed: 1.0,
    unit: 'mm',
    exportScale: 1.0,
  });

  // 4. 计算生成状态报告
  const calculations = calculateGear(params);

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col text-[#E4E4E7] antialiased font-sans pb-12">
      {/* 顶部主导航栏 */}
      <header className="bg-[#0F0F12] border-b border-[#27272A] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10 transform rotate-45">
              <Cog className="w-5.5 h-3.5 text-black stroke-[2.5] -rotate-45" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                GEAR PROFILE GENERATOR
                <span className="text-2xs bg-amber-500/15 text-amber-500 font-bold px-2 py-0.5 rounded border border-amber-500/35">
                  CAD / Laser Cut v2.2
                </span>
              </h1>
              <p className="text-2xs sm:text-xs text-[#71717A]">
                {t.app_subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 中英文语系切换开关 */}
            <div className="flex items-center gap-1 border border-[#27272A] p-0.5 rounded bg-[#141416]">
              <button
                onClick={() => setLang('zh')}
                className={`px-2.5 py-1 text-2xs rounded font-bold transition-all ${
                  lang === 'zh'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-[#71717A] hover:text-[#E4E4E7]'
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 text-2xs rounded font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-[#71717A] hover:text-[#E4E4E7]'
                }`}
              >
                EN
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#A1A1AA] font-mono border-l border-[#27272A] pl-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{t.app_cad_ready}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主控制面板工作流 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ==================== 左列 / 齿轮发生器交互画布大区 (7/12) ==================== */}
          <div className="lg:col-span-7 space-y-6 flex flex-col">
            
            {/* 1. 核心实况向量绘图区 */}
            <GearViewer
              params={params}
              matingParams={matingParams}
              renderOptions={renderOptions}
              onRenderOptionsChange={setRenderOptions}
              onMatingChange={setMatingParams}
              lang={lang}
            />

            {/* 2. 工艺尺寸实况计算数据卡 */}
            <StatsPanel
              params={params}
              calculations={calculations}
              unit={renderOptions.unit}
              lang={lang}
            />
          </div>

          {/* ==================== 右列 / 侧边高级参数面板 & 导出操作 (5/12) ==================== */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. 主控制面板(选项卡参数控制) */}
            <ParameterPanel
              params={params}
              onChange={setParams}
              matingParams={matingParams}
              onMatingChange={setMatingParams}
              renderOptions={renderOptions}
              onRenderOptionsChange={setRenderOptions}
              lang={lang}
            />
            
          </div>
        </div>
      </main>

      {/* 底部详细技术资料与几何知识 */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 border-t border-[#27272A] pt-8 text-xs text-[#71717A]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-amber-500 mb-3 flex items-center gap-1 uppercase tracking-wider">{t.app_formula_ref}</h4>
            <ul className="space-y-2 leading-relaxed text-[#A1A1AA] font-sans text-xs">
              <li className="flex items-start gap-2">
                <span className="text-amber-500/80 font-bold font-mono">▸</span>
                <span>{t.app_formula_pitch}<span className="text-white font-mono bg-[#141416] px-1.5 py-0.5 rounded border border-[#27272A] text-2xs">d = m × z</span>{t.app_formula_pitch_desc}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500/80 font-bold font-mono">▸</span>
                <span>{t.app_formula_base}<span className="text-white font-mono bg-[#141416] px-1.5 py-0.5 rounded border border-[#27272A] text-2xs">d<sub>b</sub> = d × cos(α)</span>{t.app_formula_base_desc}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500/80 font-bold font-mono">▸</span>
                <span>{t.app_formula_addendum}<span className="text-white font-mono bg-[#141416] px-1.5 py-0.5 rounded border border-[#27272A] text-2xs">d<sub>a</sub> = m × (z + 2 × h<sub>a</sub><sup>*</sup> + 2 × x)</span>{t.app_formula_addendum_desc}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500/80 font-bold font-mono">▸</span>
                <span>{t.app_formula_dedendum}<span className="text-white font-mono bg-[#141416] px-1.5 py-0.5 rounded border border-[#27272A] text-2xs">d<sub>f</sub> = m × (z - 2 × h<sub>a</sub><sup>*</sup> - 2 × c<sup>*</sup> + 2 × x)</span>{t.app_formula_dedendum_desc}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-amber-500 mb-3 flex items-center gap-1 uppercase tracking-wider">{t.app_purpose_shift}</h4>
            <p className="leading-relaxed text-[#A1A1AA] text-xs">
              {t.app_purpose_text}
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-[#27272A] text-center text-[#52525B]">
          <p>{t.app_copyright}</p>
        </div>
      </footer>
    </div>
  );
}
