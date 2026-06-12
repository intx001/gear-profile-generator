import React, { useState } from 'react';
import { GearParams, MatingGearParams, RenderOptions, SpokeType } from '../types';
import { Settings, Cog, RotateCcw, HelpCircle } from 'lucide-react';

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: string;
  className?: string;
  isInteger?: boolean;
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  className,
  isInteger = false,
}: NumberInputProps) {
  const [localVal, setLocalVal] = useState<string>(value.toString());

  React.useEffect(() => {
    const parsed = isInteger ? parseInt(localVal, 10) : parseFloat(localVal);
    if (parsed !== value && !isNaN(value)) {
      setLocalVal(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalVal(raw);
    const parsed = isInteger ? parseInt(raw, 10) : parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    let parsed = isInteger ? parseInt(localVal, 10) : parseFloat(localVal);
    if (isNaN(parsed)) {
      parsed = value;
    }
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;
    setLocalVal(parsed.toString());
    onChange(parsed);
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
}

interface ParameterPanelProps {
  params: GearParams;
  onChange: (p: GearParams) => void;
  matingParams: MatingGearParams;
  onMatingChange: (m: MatingGearParams) => void;
  renderOptions: RenderOptions;
  onRenderOptionsChange: (r: RenderOptions) => void;
}

export default function ParameterPanel({
  params,
  onChange,
  matingParams,
  onMatingChange,
  renderOptions,
  onRenderOptionsChange,
}: ParameterPanelProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'mating'>('basic');
  const standardCenterDistance = params.modulus * (params.teeth + matingParams.teeth) / 2 + (params.profileShift + matingParams.profileShift) * params.modulus;
  const standardMatingTipDiameter = params.modulus * matingParams.teeth + 2 * ((matingParams.addendumCoeff ?? 1.0) + matingParams.profileShift) * params.modulus;

  const updateParam = (key: keyof GearParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  const updateMatingParam = (key: keyof MatingGearParams, value: any) => {
    onMatingChange({ ...matingParams, [key]: value });
  };

  const updateRenderOption = (key: keyof RenderOptions, value: any) => {
    onRenderOptionsChange({ ...renderOptions, [key]: value });
  };

  // 快捷设置标准渐开线齿轮参数
  const resetToStandard = () => {
    onChange({
      modulus: 2,
      teeth: 20,
      pressureAngle: 20,
      profileShift: 0,
      addendumCoeff: 1.0,
      clearanceCoeff: 0.25,
      filletCoeff: 0.38,
      shaftDiameter: 8,
      hasKeyway: false,
      keywayWidth: 3,
      keywayDepth: 1.4,
      spokeType: 'none',
      spokesCount: 4,
      spokeRatio: 0.6,
      kerf: 0,
    });
  };

  return (
    <div id="parameter-panel" className="bg-[#0F0F12] rounded-lg border border-[#27272A] overflow-hidden h-full flex flex-col">
      {/* 模块标题与标准重置 */}
      <div className="p-5 border-b border-[#27272A] flex items-center justify-between bg-[#141416]">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-semibold text-white">齿轮参数设置</h2>
        </div>
        <button
          onClick={resetToStandard}
          className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 px-2.5 py-1.5 rounded-sm border border-amber-500/30 transition-colors bg-amber-500/5 font-bold"
          title="恢复基础参数：2模数，20齿标准直齿轮"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          重置为标准齿轮
        </button>
      </div>

      {/* 选项卡栏 */}
      <div className="flex border-b border-[#27272A] text-xs sm:text-sm font-medium bg-[#0F0F12]">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-3 text-center transition-all border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1 ${
            activeTab === 'basic'
              ? 'border-amber-500 text-amber-500 bg-amber-500/5 font-bold'
              : 'border-transparent text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Cog className="w-4 h-4" />
          <span>齿廓基本参数</span>
        </button>
        <button
          onClick={() => setActiveTab('mating')}
          className={`flex-1 py-3 text-center transition-all border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1 ${
            activeTab === 'mating'
              ? 'border-amber-500 text-amber-500 bg-amber-500/5 font-bold'
              : 'border-transparent text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <RotateCcw className="w-4 h-4 rotate-45" />
          <span>啮合仿真</span>
        </button>
      </div>

      {/* 滚动的参数参数内容 */}
      <div className="p-5 overflow-y-auto flex-1 space-y-5 text-sm bg-[#0F0F12]">
        {/* ==================== 1. 齿廓基本参数 ==================== */}
        {activeTab === 'basic' && (
          <div className="space-y-4 animate-fade-in text-[#E4E4E7]">
            {/* 模数 m */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-medium text-[#A1A1AA] flex items-center gap-1">
                  模数 m (mm)
                  <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title="齿轮尺寸的核心参数，模数越大轮廓越大" />
                </label>
                <NumberInput
                  min={0.1}
                  max={100}
                  step="0.01"
                  value={params.modulus}
                  onChange={(v) => updateParam('modulus', v)}
                  className="w-24 px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
              <div className="text-2xs text-[#71717A]">
                常用标准模数系列: 1.0, 1.5, 2.0, 2.5, 3.0, 4.0 (支持任意非标小数设定)
              </div>
            </div>

            {/* 齿数 z */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-medium text-[#A1A1AA] flex items-center gap-1">
                  齿数 z
                  <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title="齿轮的牙齿个数，对于直齿圈，齿数越多角度越平缓" />
                </label>
                <NumberInput
                  min={4}
                  max={300}
                  step="1"
                  value={params.teeth}
                  isInteger={true}
                  onChange={(v) => updateParam('teeth', v)}
                  className="w-24 px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
              <div className="text-2xs text-[#71717A]">
                输入范围: 4 - 300。少于 17 齿可能需要正变位参数来防止制造根切
              </div>
            </div>

            {/* 径向变位系数 x */}
            <div className="space-y-1.5 bg-[#141416] p-3 rounded-sm border border-[#27272A]">
              <div className="flex justify-between items-center">
                <label className="font-medium text-[#A1A1AA] flex items-center gap-1">
                  径向变位系数 x
                  <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title="变位系数。对于少齿数，正变位可避免根切，增强牙齿强度" />
                </label>
                <NumberInput
                  min={-2}
                  max={3}
                  step="0.01"
                  value={params.profileShift}
                  onChange={(v) => updateParam('profileShift', v)}
                  className="w-24 px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
              <div className="text-2xs text-[#71717A]">
                正变位向外偏移增厚齿根；负变位反之。通常在少齿数时建议设置正变位 (如 +0.3)
              </div>
            </div>

            {/* 齿形角/压力角 alpha */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-medium text-[#A1A1AA] flex items-center gap-1">
                  齿形角 / 压力角 α (°)
                  <HelpCircle className="w-3.5 h-3.5 text-[#52525B] cursor-help" title="渐开线接触角，工业标准为 20度，部分低摩擦传动采用 14.5度" />
                </label>
                <div className="flex gap-1.5 items-center">
                  <button
                    onClick={() => updateParam('pressureAngle', 14.5)}
                    className={`px-2 py-1 text-xs rounded-sm border ${
                      params.pressureAngle === 14.5
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold'
                        : 'border-[#27272A] bg-[#18181B] text-[#71717A] hover:bg-[#27272A] hover:text-[#E4E4E7]'
                    }`}
                  >
                    14.5°
                  </button>
                  <button
                    onClick={() => updateParam('pressureAngle', 20)}
                    className={`px-2 py-1 text-xs rounded-sm border ${
                      params.pressureAngle === 20
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold'
                        : 'border-[#27272A] bg-[#18181B] text-[#71717A] hover:bg-[#27272A] hover:text-[#E4E4E7]'
                    }`}
                  >
                    20°
                  </button>
                  <NumberInput
                    min={5}
                    max={45}
                    step="0.5"
                    value={params.pressureAngle}
                    onChange={(v) => updateParam('pressureAngle', v)}
                    className="w-16 px-1.5 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 齿顶高系数与顶隙系数 */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              {/* 齿顶高系数 ha* */}
              <div className="space-y-1.5 bg-[#141416] p-3 rounded-sm border border-[#27272A]">
                <label className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-0.5">
                  齿顶高系数 ha*
                  <HelpCircle className="w-3 h-3 text-[#52525B]" title="标准齿轮一般为 1.0，短齿齿轮通常为 0.8" />
                </label>
                <NumberInput
                  min={0.1}
                  max={3.0}
                  step="0.01"
                  value={params.addendumCoeff}
                  onChange={(v) => updateParam('addendumCoeff', v)}
                  className="w-full px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              {/* 顶隙系数 c* */}
              <div className="space-y-1.5 bg-[#141416] p-3 rounded-sm border border-[#27272A]">
                <label className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-0.5">
                  顶隙系数 c*
                  <HelpCircle className="w-3 h-3 text-[#52525B]" title="防止顶切、排气及润滑空间，标准一般为 0.25" />
                </label>
                <NumberInput
                  min={0}
                  max={1.5}
                  step="0.01"
                  value={params.clearanceCoeff}
                  onChange={(v) => updateParam('clearanceCoeff', v)}
                  className="w-full px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* 齿根过渡圆角系数 rf* */}
            <div className="space-y-1.5 bg-[#141416] p-3 rounded-sm border border-[#27272A]">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-[#A1A1AA] flex items-center gap-1">
                  齿根过渡圆角系数 rf*
                  <HelpCircle className="w-3 h-3 text-[#52525B]" title="齿根处生成的圆角半径比例，有助于均匀承载、在制造中提升抗脆性断裂强度，防止应力集中" />
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[#71717A] text-2xs">({ (params.filletCoeff * params.modulus).toFixed(2) } mm)</span>
                  <NumberInput
                    min={0}
                    max={1.0}
                    step="0.01"
                    value={params.filletCoeff}
                    onChange={(v) => updateParam('filletCoeff', v)}
                    className="w-20 px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 自定义齿顶圆直径 da */}
            <div className="space-y-1.5 bg-[#141416] p-3 rounded-sm border border-[#27272A]">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-[#A1A1AA] flex items-center gap-1">
                  自定义齿顶圆直径 da (mm)
                  <HelpCircle className="w-3 h-3 text-[#52525B]" title="修改此项可直接手动调大/调小齿顶圆，通常减小齿顶圆以防止啮合卡滞、干涉" />
                </label>
                <div className="flex items-center gap-1.5">
                  <NumberInput
                    min={0.1}
                    max={2000}
                    step="0.01"
                    value={typeof params.customTipDiameter === 'number' ? params.customTipDiameter : (params.modulus * params.teeth + 2 * (params.addendumCoeff + params.profileShift) * params.modulus)}
                    onChange={(v) => updateParam('customTipDiameter', v)}
                    className="w-24 px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                  />
                  {typeof params.customTipDiameter === 'number' && (
                    <button
                      type="button"
                      onClick={() => updateParam('customTipDiameter', undefined)}
                      className="text-3xs text-amber-500 hover:text-amber-400 font-mono px-1.5 py-1 border border-amber-500/35 rounded bg-amber-500/10 cursor-pointer h-6 flex items-center justify-center"
                      title="恢复为标准计算值"
                    >
                      重置
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-2xs text-[#71717A]">
                <span>标准计算值：</span>
                <span className="font-mono">{(params.modulus * params.teeth + 2 * (params.addendumCoeff + params.profileShift) * params.modulus).toFixed(3)} mm</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 4. 啮合仿真配对齿轮 ==================== */}
        {activeTab === 'mating' && (
          <div className="space-y-4 animate-fade-in text-sm text-[#E4E4E7]">
            <div className="space-y-3 p-3 rounded-sm border border-[#27272A] bg-[#141416] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-[#A1A1AA] block">启用第二配对齿轮进行仿真</span>
                <span className="text-2xs text-[#71717A]">在主窗口中生成配对啮合传动的预览</span>
              </div>
              <input
                type="checkbox"
                checked={matingParams.enabled}
                onChange={(e) => updateMatingParam('enabled', e.target.checked)}
                className="w-4 h-4 text-amber-500 border-[#27272A] bg-[#18181B] rounded focus:ring-amber-500 cursor-pointer accent-amber-500"
              />
            </div>

            {matingParams.enabled ? (
              <div className="space-y-4 animate-slide-up">
                  {/* 配对齿数 z2 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-[#A1A1AA]">配对齿轮齿数 z2</span>
                      <NumberInput
                        min={6}
                        max={150}
                        step="1"
                        value={matingParams.teeth}
                        isInteger={true}
                        onChange={(v) => updateMatingParam('teeth', v)}
                        className="w-24 px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div className="flex justify-between text-2xs text-[#71717A]">
                      <span>理想传动配比数：</span>
                      <span className="text-amber-500 font-bold">{(params.teeth / matingParams.teeth).toFixed(2)} : 1</span>
                    </div>
                  </div>

                  {/* 配对变位系数 x2 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-[#A1A1AA] flex items-center gap-1">
                        配对齿轮变位系数 x2
                      </span>
                      <NumberInput
                        min={-1}
                        max={1.5}
                        step="0.01"
                        value={matingParams.profileShift}
                        onChange={(v) => updateMatingParam('profileShift', v)}
                        className="w-24 px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* 配对齿轮齿顶高系数与顶隙系数 */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* 配对齿轮齿顶高系数 ha2* */}
                    <div className="space-y-1.5 p-3 rounded-sm border border-[#27272A] bg-[#141416]">
                      <label className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-0.5">
                        配对齿顶高 ha2*
                        <HelpCircle className="w-3 h-3 text-[#52525B]" title="配对齿轮齿顶高系数，标准为 1.0" />
                      </label>
                      <NumberInput
                        min={0.1}
                        max={3.0}
                        step="0.01"
                        value={matingParams.addendumCoeff}
                        onChange={(v) => updateMatingParam('addendumCoeff', v)}
                        className="w-full px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>

                    {/* 配对齿轮顶隙系数 c2* */}
                    <div className="space-y-1.5 p-3 rounded-sm border border-[#27272A] bg-[#141416]">
                      <label className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-0.5">
                        配对顶隙 c2*
                        <HelpCircle className="w-3 h-3 text-[#52525B]" title="配对齿轮顶隙系数，标准为 0.25" />
                      </label>
                      <NumberInput
                        min={0}
                        max={1.5}
                        step="0.01"
                        value={matingParams.clearanceCoeff}
                        onChange={(v) => updateMatingParam('clearanceCoeff', v)}
                        className="w-full px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* 配对齿轮自定义齿顶圆直径 da2 */}
                  <div className="space-y-1.5 bg-[#141416] p-3 rounded-sm border border-[#27272A]">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold text-[#A1A1AA] flex items-center gap-1">
                        配对自定义齿顶圆 da2 (mm)
                        <HelpCircle className="w-3 h-3 text-[#52525B]" title="修改此项可手动微调配对齿轮的齿顶圆，通常减小它以防啮合干涉或卡滞" />
                      </label>
                      <div className="flex items-center gap-1.5">
                        <NumberInput
                          min={0.1}
                          max={2000}
                          step="0.01"
                          value={typeof matingParams.customTipDiameter === 'number' ? matingParams.customTipDiameter : standardMatingTipDiameter}
                          onChange={(v) => updateMatingParam('customTipDiameter', v)}
                          className="w-24 px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                        />
                        {typeof matingParams.customTipDiameter === 'number' && (
                          <button
                            type="button"
                            onClick={() => updateMatingParam('customTipDiameter', undefined)}
                            className="text-3xs text-amber-500 hover:text-amber-400 font-mono px-1.5 py-1 border border-amber-500/35 rounded bg-amber-500/10 cursor-pointer h-6 flex items-center justify-center"
                            title="恢复为标准计算值"
                          >
                            重置
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-2xs text-[#71717A]">
                      <span>标准计算值：</span>
                      <span className="font-mono">{standardMatingTipDiameter.toFixed(3)} mm</span>
                    </div>
                  </div>

                  {/* 2齿中心距 a */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-[#A1A1AA] flex items-center gap-1">
                        2齿中心距 a (mm)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <NumberInput
                          min={0.1}
                          max={2000}
                          step="0.01"
                          value={typeof matingParams.customCenterDistance === 'number' ? matingParams.customCenterDistance : standardCenterDistance}
                          onChange={(v) => updateMatingParam('customCenterDistance', v)}
                          className="w-24 px-2 py-1 text-xs text-right border border-[#27272A] bg-[#18181B] text-white rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                        />
                        {typeof matingParams.customCenterDistance === 'number' && (
                          <button
                            type="button"
                            onClick={() => updateMatingParam('customCenterDistance', undefined)}
                            className="text-3xs text-amber-500 hover:text-amber-400 font-mono px-1 border border-amber-500/35 rounded bg-amber-500/10 cursor-pointer h-6 flex items-center justify-center"
                            title="恢复为标准计算值"
                          >
                            重置
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-2xs text-[#71717A]">
                      <span>标准计算值：</span>
                      <span className="font-mono">{standardCenterDistance.toFixed(3)} mm</span>
                    </div>
                  </div>

                  {/* 动态传动动画 */}
                  <div className="space-y-2 p-3 rounded-sm border border-dashed border-[#27272A] bg-amber-500/5">
                    <span className="text-xs font-semibold text-white block">动画旋转控制</span>
                    
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => updateRenderOption('animate', !renderOptions.animate)}
                        className="flex-1 py-1 px-2.5 rounded-sm text-xs font-bold transition-all bg-amber-500 text-black hover:bg-amber-400"
                      >
                        {renderOptions.animate ? '暂停运动' : '播放联动演示'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => updateMatingParam('rotationAngle', 0)}
                        className="px-2 py-1 text-[#A1A1AA] hover:text-white border border-[#27272A] bg-[#18181B] rounded-sm text-xs"
                        title="复位运动角度"
                      >
                        复位
                      </button>
                    </div>

                    {/* 旋转速度 */}
                    <div className="space-y-1.5 pt-1.5 text-xs text-[#71717A] flex items-center justify-between">
                      <span>播放运行转速</span>
                      <div className="flex gap-1">
                        {[0.25, 0.5, 1.0, 2.0].map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => updateRenderOption('playbackSpeed', speed)}
                            className={`px-1.5 py-0.5 text-3xs font-mono rounded-sm border ${
                              renderOptions.playbackSpeed === speed
                                ? 'bg-amber-500 border-amber-500 text-black font-semibold'
                                : 'bg-[#18181B] border-[#27272A] text-[#71717A] hover:text-[#E4E4E7]'
                            }`}
                          >
                            {speed === 0.25 ? '0.25x' : speed.toFixed(1) + 'x'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
              </div>
            ) : (
              <div className="text-center p-6 text-[#71717A] text-xs">
                勾选上方开关，我们将为您实时计算并在画布右侧绘制与之配对咬合转动的副齿轮。您可以借此检查相互干涉和啮合深度。
              </div>
            )}
          </div>
        )}
      </div>

      {/* 画布显示控制复选框 */}
      <div className="p-4 border-t border-[#27272A] bg-[#141416] text-xs space-y-2.5">
        <span className="font-semibold text-[#E4E4E7] block">辅助图层显示</span>
        
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-1.5 text-[#A1A1AA] hover:text-white select-none cursor-pointer">
            <input
              type="checkbox"
              checked={renderOptions.showPitchCircle}
              onChange={(e) => updateRenderOption('showPitchCircle', e.target.checked)}
              className="w-3.5 h-3.5 text-amber-500 border-[#27272A] bg-[#18181B] rounded focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
            分度圆 d (蓝色虚线)
          </label>
          <label className="flex items-center gap-1.5 text-[#A1A1AA] hover:text-white select-none cursor-pointer">
            <input
              type="checkbox"
              checked={renderOptions.showBaseCircle}
              onChange={(e) => updateRenderOption('showBaseCircle', e.target.checked)}
              className="w-3.5 h-3.5 text-amber-500 border-[#27272A] bg-[#18181B] rounded focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
            基圆 db (橘色虚线)
          </label>
          <label className="flex items-center gap-1.5 text-[#A1A1AA] hover:text-white select-none cursor-pointer">
            <input
              type="checkbox"
              checked={renderOptions.showAddendumCircle}
              onChange={(e) => updateRenderOption('showAddendumCircle', e.target.checked)}
              className="w-3.5 h-3.5 text-amber-500 border-[#27272A] bg-[#18181B] rounded focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
            齿顶圆 da (绿色)
          </label>
          <label className="flex items-center gap-1.5 text-[#A1A1AA] hover:text-white select-none cursor-pointer">
            <input
              type="checkbox"
              checked={renderOptions.showDedendumCircle}
              onChange={(e) => updateRenderOption('showDedendumCircle', e.target.checked)}
              className="w-3.5 h-3.5 text-amber-500 border-[#27272A] bg-[#18181B] rounded focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
            齿根圆 df (红褐色)
          </label>
        </div>

        <div className="pt-1.5 border-t border-[#27272A] flex justify-between gap-4">
          <label className="flex items-center gap-1.5 text-[#A1A1AA] hover:text-white select-none cursor-pointer">
            <input
              type="checkbox"
              checked={renderOptions.showGrid}
              onChange={(e) => updateRenderOption('showGrid', e.target.checked)}
              className="w-3.5 h-3.5 text-amber-500 border-[#27272A] bg-[#18181B] rounded focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
            刻度正交网格
          </label>
          
          <div className="flex gap-1">
            <button
              onClick={() => updateRenderOption('unit', 'mm')}
              className={`px-2 py-0.5 text-2xs rounded-sm border ${
                renderOptions.unit === 'mm'
                  ? 'bg-amber-500 border-amber-500 text-black font-bold'
                  : 'bg-[#18181B] border-[#27272A] text-[#71717A] hover:text-white'
              }`}
            >
              公制 (mm)
            </button>
            <button
              onClick={() => updateRenderOption('unit', 'inch')}
              className={`px-2 py-0.5 text-2xs rounded-sm border ${
                renderOptions.unit === 'inch'
                  ? 'bg-amber-500 border-amber-500 text-black font-bold'
                  : 'bg-[#18181B] border-[#27272A] text-[#71717A] hover:text-white'
              }`}
            >
              英制 (inch)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
