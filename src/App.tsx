import React, { useState } from 'react';
import { GearParams, MatingGearParams, RenderOptions } from './types';
import { calculateGear } from './utils/gearMath';
import ParameterPanel from './components/ParameterPanel';
import StatsPanel from './components/StatsPanel';
import GearViewer from './components/GearViewer';
import { Cog, ShieldCheck, Printer, FileDown, Layers, Columns } from 'lucide-react';

export default function App() {
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
                支持标准/径向变位直齿轮数学建模，提供轻量化镂空腔体与割缝尺寸膨胀补偿，支持激光加工 1:1 SVG 矢量文件下载
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-[#A1A1AA] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>CAD_READY_TO_EXPORT (公制物理级标定)</span>
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
            />

            {/* 2. 工艺尺寸实况计算数据卡 */}
            <StatsPanel
              params={params}
              calculations={calculations}
              unit={renderOptions.unit}
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
            />
            
          </div>
        </div>
      </main>

      {/* 底部详细技术资料与几何知识 */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 border-t border-[#27272A] pt-8 text-xs text-[#71717A]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-amber-500 mb-3 flex items-center gap-1 uppercase tracking-wider">🌐 渐开线齿物理几何公式参考</h4>
            <ul className="space-y-2 leading-relaxed text-[#A1A1AA] font-sans text-xs">
              <li className="flex items-start gap-2">
                <span className="text-amber-500/80 font-bold font-mono">▸</span>
                <span>分度圆直径：<span className="text-white font-mono bg-[#141416] px-1.5 py-0.5 rounded border border-[#27272A] text-2xs">d = m × z</span> (标准齿轮齿部基准依据)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500/80 font-bold font-mono">▸</span>
                <span>基圆直径：<span className="text-white font-mono bg-[#141416] px-1.5 py-0.5 rounded border border-[#27272A] text-2xs">d<sub>b</sub> = d × cos(α)</span> (决定渐开线型线的展成轨迹基准)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500/80 font-bold font-mono">▸</span>
                <span>齿顶圆直径：<span className="text-white font-mono bg-[#141416] px-1.5 py-0.5 rounded border border-[#27272A] text-2xs">d<sub>a</sub> = m × (z + 2 × h<sub>a</sub><sup>*</sup> + 2 × x)</span> (齿廓最外围边缘界线)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500/80 font-bold font-mono">▸</span>
                <span>齿根圆直径：<span className="text-white font-mono bg-[#141416] px-1.5 py-0.5 rounded border border-[#27272A] text-2xs">d<sub>f</sub> = m × (z - 2 × h<sub>a</sub><sup>*</sup> - 2 × c<sup>*</sup> + 2 × x)</span> (轮齿槽底部最低圈)</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-amber-500 mb-3 flex items-center gap-1 uppercase tracking-wider">⚙️ 变位齿轮 (Profile Shift) 功用</h4>
            <p className="leading-relaxed text-[#A1A1AA] text-xs">
              当齿轮齿数较少（如 <code className="font-mono bg-[#141416] text-[#E4E4E7] px-1 py-0.5 rounded">z &lt; 17</code>）时，标准齿轮滚法加工会导致由于刀具干涉削弱轮轴强度，即所谓的 <b>“齿根根切”</b>，极大降低轮齿抗剪折弯极限。
              <br /><br />
              在此系统里，通过设置 <b>正径向变位系数 <code className="font-mono bg-[#141416] text-[#E4E4E7] px-1 py-0.5 rounded">x &gt; 0</code></b>，你能观察到齿顶、齿分度圆以及渐开线物理向外侧生长，增大了轮齿根基厚度，从而从根本上消除弱切损害，优化整体轮齿强度与磨损。
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-[#27272A] text-center text-[#52525B]">
          <p>© 2026 高精度齿轮几何发生引擎. 本在线工具对数学公式结果负责，请在导入高速重载切削床前自测验证。</p>
        </div>
      </footer>
    </div>
  );
}
