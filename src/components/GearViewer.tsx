import React, { useRef, useState, useEffect } from 'react';
import { GearParams, MatingGearParams, RenderOptions } from '../types';
import { generateFullGearSVGPath, calculateGear, generateSingleToothProfile, pointsToSVGPath } from '../utils/gearMath';
import { ZoomIn, ZoomOut, Maximize2, Play, Pause, Move, Download } from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/lang';

interface GearViewerProps {
  params: GearParams;
  matingParams: MatingGearParams;
  renderOptions: RenderOptions;
  onRenderOptionsChange: (r: RenderOptions) => void;
  onMatingChange: (m: MatingGearParams) => void;
  lang?: Language;
}

export default function GearViewer({
  params,
  matingParams,
  renderOptions,
  onRenderOptionsChange,
  onMatingChange,
  lang = 'zh',
}: GearViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragAreaRef = useRef<HTMLDivElement>(null);
  
  // 视图模式: full = 全轮啮合仿真
  const viewerMode = 'full';

  // 视口拖拽与缩放
  const [zoom, setZoom] = useState(3.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 底部重要参数栏收起/折叠状态
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  useEffect(() => {
    // 手机/小屏端（宽度小于768px）默认收起以防止阻挡齿轮主体
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsLegendCollapsed(true);
    }
  }, []);
  
  // 旋转控制
  const [rotAngle, setRotAngle] = useState(0);
  const requestRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);

  // 1. 物理计算 & 高级啮合计算
  const gear1 = calculateGear(params);
  const gear2Data = matingMatingGearData();

  // 1:1 物理尺寸 SVG 矢量文件下载功能
  const downloadSVG = () => {
    const { pathData: gear1Path } = generateFullGearSVGPath(params);
    const margin = 10; // 10mm 留白边距
    const size = Math.ceil(gear1.addendumDiameter + margin * 2);
    const halfSize = size / 2;

    const svgContent = `<?xml version="1.0" encoding="utf-8"?>
<!-- 
  High-Precision Spur Gear Vector (1:1 Metric Scale)
  Modulus: ${params.modulus} mm
  Teeth: ${params.teeth}
  Profile Shift Coefficient (x): ${params.profileShift}
  Addendum Coefficient (ha*): ${params.addendumCoeff}
  Clearance Coefficient (c*): ${params.clearanceCoeff}
  Base Diameter: ${gear1.baseDiameter.toFixed(3)} mm
  Tip Diameter: ${gear1.addendumDiameter.toFixed(3)} mm
  Root Diameter: ${gear1.dedendumDiameter.toFixed(3)} mm
  Shaft Diameter: ${params.shaftDiameter} mm
  Spokes: ${params.spokeType}
  Generated via High-Precision Gear Profile Generator
-->
<svg xmlns="http://www.w3.org/2000/svg" width="${size}mm" height="${size}mm" viewBox="-${halfSize} -${halfSize} ${size} ${size}">
  <g id="gear-mesh" transform="rotate(-90)">
    <path d="${gear1Path}" fill="none" stroke="#000000" stroke-width="0.2" fill-rule="evenodd" />
  </g>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spur-gear-m${params.modulus.toFixed(2)}-z${params.teeth}-x${params.profileShift.toFixed(2)}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 共享的单齿微观几何量
  const r_geom = (params.modulus * params.teeth) / 2;
  const r_b_geom = r_geom * Math.cos((params.pressureAngle * Math.PI) / 180);
  const r_a_geom = typeof params.customTipDiameter === 'number'
    ? params.customTipDiameter / 2
    : r_geom + (params.addendumCoeff + params.profileShift) * params.modulus;
  const r_f_geom = r_geom - (params.addendumCoeff + params.clearanceCoeff - params.profileShift) * params.modulus;
  const alphaRad_geom = (params.pressureAngle * Math.PI) / 180;
  const s_geom = params.modulus * (Math.PI / 2 + 2 * params.profileShift * Math.tan(alphaRad_geom));
  const deltaTheta_geom = s_geom / r_geom / 2;

  // 齿轮2变位与齿数计算
  function matingMatingGearData() {
    if (!matingParams.enabled) return null;
    const g2Params: GearParams = {
      ...params,
      teeth: matingParams.teeth,
      profileShift: matingParams.profileShift,
      addendumCoeff: matingParams.addendumCoeff,
      clearanceCoeff: matingParams.clearanceCoeff,
      customTipDiameter: matingParams.customTipDiameter,
      shaftDiameter: Math.min(params.modulus * matingParams.teeth * 0.4, 12), // 智能匹配孔径
      hasKeyway: false, // 联动不需要次齿轮显示键槽
      spokeType: 'none',
    };
    const calculations = calculateGear(g2Params);
    const svgRes = generateFullGearSVGPath(g2Params);
    return {
      calculations,
      pathData: svgRes.pathData,
    };
  }

  // 轴间距计算: a_0 = m * (z1 + z2) / 2 + (x1 + x2)*m
  const standardCenterDistance = params.modulus * (params.teeth + matingParams.teeth) / 2 + (params.profileShift + matingParams.profileShift) * params.modulus;
  const centerDistance = matingParams.enabled && gear2Data
    ? (typeof matingParams.customCenterDistance === 'number' ? matingParams.customCenterDistance : standardCenterDistance)
    : 0;

  // 减去小空隙 (为了使显示效果咬合更美观，我们可以微调微调咬合深度系数，并在这里允许传动)
  const animatedAngle1 = rotAngle;
  // 速度比 = z1 / z2, 齿轮2反向旋转
  // 齿轮相位补偿：
  // 齿轮1的齿恰好卡在齿轮2的齿缝中：
  // 当 Gear1 旋转 A 时，Gear2 的旋转为：-A * (z1/z2) + 180 + 相位角
  const theta1 = animatedAngle1;
  const teethRatio = params.teeth / matingParams.teeth;
  const phaseOffset = params.teeth % 2 === 0 ? 180 : 180 + (180 / matingParams.teeth);
  // 加入配对齿轮的手动微调 rotationAngle 能够修正任何奇偶不对齐的问题
  const theta2 = (180 - theta1 * teethRatio) + (180 / matingParams.teeth) + matingParams.rotationAngle;

  // 2. 动画传动循环
  useEffect(() => {
    if (renderOptions.animate) {
      const animate = (time: number) => {
        if (prevTimeRef.current !== null) {
          const delta = time - prevTimeRef.current;
          // 增量角速度：根据播放速度与 delta
          const speedFactor = 0.02 * renderOptions.playbackSpeed;
          setRotAngle((prev) => (prev + delta * speedFactor) % 360);
        }
        prevTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
      };
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      prevTimeRef.current = null;
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [renderOptions.animate, renderOptions.playbackSpeed]);

  // 3. 自适应居中 Zoom to Fit
  const resetZoom = () => {
    if (matingParams.enabled) {
      // 两个齿轮
      setZoom(Math.max(1.5, Math.min(4, 300 / (centerDistance + gear1.addendumDiameter))));
      setPan({ x: -centerDistance / 3, y: 0 });
    } else {
      // 单个齿轮
      setZoom(Math.max(2, Math.min(8, 260 / gear1.addendumDiameter)));
      setPan({ x: 0, y: 0 });
    }
  };

  // 初始化时重置缩放
  useEffect(() => {
    resetZoom();
  }, [params.teeth, params.modulus, matingParams.enabled, centerDistance]);

  // 实况控制：非 passive 滚轮事件阻止双重背景滚动
  useEffect(() => {
    const el = dragAreaRef.current;
    if (!el) return;

    const handleWheelRaw = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.1;

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

      setZoom((prevZoom) => {
        const nextZoom = Math.max(0.2, Math.min(5000, prevZoom * factor));
        const actualFactor = nextZoom / prevZoom;

        setPan((prevPan) => {
          // 视图绘图中心的平移偏移
          const originX = 260;
          const originY = 240;
          return {
            x: mouseX - originX - (mouseX - originX - prevPan.x) * actualFactor,
            y: mouseY - originY - (mouseY - originY - prevPan.y) * actualFactor,
          };
        });

        return nextZoom;
      });
    };

    el.addEventListener('wheel', handleWheelRaw, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheelRaw);
    };
  }, []);

  // 4. 平移事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 4b. 触控事件处理（对移动端适配）
  const [touchDistance, setTouchDistance] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDistance(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchDistance !== null) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const zoomFactor = newDist / touchDistance;

      const el = dragAreaRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

        setZoom((prevZoom) => {
          const nextZoom = Math.max(0.2, Math.min(5000, prevZoom * zoomFactor));
          const actualFactor = nextZoom / prevZoom;

          setPan((prevPan) => {
            const originX = 260; // 必须和 transform 中的数值对齐
            const originY = 240;
            return {
              x: centerX - originX - (centerX - originX - prevPan.x) * actualFactor,
              y: centerY - originY - (centerY - originY - prevPan.y) * actualFactor,
            };
          });

          return nextZoom;
        });
      }
      setTouchDistance(newDist);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setTouchDistance(null);
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(5000, prev * 1.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.2, prev / 1.2));

  // 5. 渲染基础齿轮数据
  const { pathData: gear1Path } = generateFullGearSVGPath(params);

  // 渲染网格线
  const renderGridLines = () => {
    if (!renderOptions.showGrid) return null;
    const gridPoints = [];
    const divisions = 24;
    const step = 20; // 20mm 大网格，4mm 小网格
    
    // 生成网格线
    for (let i = -divisions; i <= divisions; i++) {
      const pos = i * step;
      // 竖面
      gridPoints.push(
        <line
          key={`vline-${i}`}
          x1={pos}
          y1={-divisions * step}
          x2={pos}
          y2={divisions * step}
          stroke={i === 0 ? '#3F3F46' : '#141416'}
          strokeWidth={i === 0 ? 1.2 : 0.8}
          vectorEffect="non-scaling-stroke"
        />
      );
      // 横面
      gridPoints.push(
        <line
          key={`hline-${i}`}
          x1={-divisions * step}
          y1={pos}
          x2={divisions * step}
          y2={pos}
          stroke={i === 0 ? '#3F3F46' : '#141416'}
          strokeWidth={i === 0 ? 1.2 : 0.8}
          vectorEffect="non-scaling-stroke"
        />
      );
    }
    
    // 生成同心圆刻度线
    for (let r = 50; r <= 200; r += 50) {
      gridPoints.push(
        <circle
          key={`grid-circle-${r}`}
          cx={0}
          cy={0}
          r={r}
          fill="none"
          stroke="#27272A"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          strokeDasharray="4,8"
        />
      );
      gridPoints.push(
        <g key={`grid-text-group-${r}`} transform={`translate(${r}, 4) scale(${1 / zoom})`}>
          <text
            x={4}
            y={3}
            fill="#52525B"
            fontFamily="monospace"
            className="select-none"
            style={{ fontSize: '9px' }}
          >
            {r}mm
          </text>
        </g>
      );
    }
    
    return <g id="coordinate-grid">{gridPoints}</g>;
  };

  // 6. 渲染单个齿的微观齿形及标注
  const renderSingleToothView = () => {
    const singleTooth = generateSingleToothProfile(params);
    
    // 连接到圆心 (0,0) 并闭合路径，形成扇形实体
    const toothPath = pointsToSVGPath(singleTooth.points, false) + " L 0 0 Z";
    
    // 限制虚线圆弧和标注仅在单齿跨度区域内渲染，实现完美的聚焦微观对称齿形分析
    const spanRadLocal = deltaTheta_geom * 2.2 + 0.15;
    
    const getArc = (radius: number, start: number, end: number) => {
      const x1 = radius * Math.cos(start);
      const y1 = radius * Math.sin(start);
      const x2 = radius * Math.cos(end);
      const y2 = radius * Math.sin(end);
      const largeArc = Math.abs(end - start) > Math.PI ? 1 : 0;
      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    };

    // 迷你指示标注：水平不重合地优雅显示，支持逆缩放，恒定屏幕 10px 极其清晰
    const renderMiniLabel = (radius: number, text: string, color: string) => {
      const angle = deltaTheta_geom * 2.1 + 0.05;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      return (
        <g key={`mini-lbl-${radius}`} transform={`translate(${x}, ${y}) scale(${1 / zoom}) rotate(90)`}>
          <text
            x={2}
            y={3}
            fill={color}
            fontFamily="monospace"
            textAnchor="start"
            className="font-bold select-none"
            style={{ fontSize: '10px' }}
          >
            {text}
          </text>
        </g>
      );
    };

    return (
      <g transform="rotate(-90)">
        {/* 背景辅助同心圆弧 (精简限制到单齿宽度，响应 “不用显示整个圆，可以显示单个齿形” 这一述求，全矢量抗锯齿) */}
        <path d={getArc(r_a_geom, -spanRadLocal, spanRadLocal)} fill="none" stroke="#22C55E" strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeDasharray="2,2" />
        <path d={getArc(r_geom, -spanRadLocal, spanRadLocal)} fill="none" stroke="#38BDF8" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeDasharray="2,2" />
        <path d={getArc(r_b_geom, -spanRadLocal, spanRadLocal)} fill="none" stroke="#FB923C" strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeDasharray="2,4" />
        <path d={getArc(r_f_geom, -spanRadLocal, spanRadLocal)} fill="none" stroke="#F87171" strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeDasharray="2,2" />

        {/* 渐开线和分度圆交点连接圆心线 */}
        <line x1={0} y1={0} x2={r_a_geom + 1.5} y2={0} stroke="#3F3F46" strokeWidth={1} vectorEffect="non-scaling-stroke" strokeDasharray="2,2" />

        {/* 实体齿形槽 */}
        <path
          d={toothPath}
          fill="rgba(245, 158, 11, 0.06)"
          stroke="#F59E0B"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          fillRule="evenodd"
        />

        {/* 齿厚弧段及分度圆交点 */}
        <path
          d={getArc(r_geom, -deltaTheta_geom, deltaTheta_geom)}
          fill="none"
          stroke="#F2994A"
          strokeWidth={3}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={singleTooth.pitchIntersectionLeft.x} cy={singleTooth.pitchIntersectionLeft.y} r={3.5 / zoom} fill="#38BDF8" stroke="#000000" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <circle cx={singleTooth.pitchIntersectionRight.x} cy={singleTooth.pitchIntersectionRight.y} r={3.5 / zoom} fill="#38BDF8" stroke="#000000" strokeWidth={1} vectorEffect="non-scaling-stroke" />

        {/* 基圆渐开线起点交点 */}
        <circle cx={singleTooth.baseIntersectionLeft.x} cy={singleTooth.baseIntersectionLeft.y} r={3 / zoom} fill="#FB923C" stroke="#000000" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <circle cx={singleTooth.baseIntersectionRight.x} cy={singleTooth.baseIntersectionRight.y} r={3 / zoom} fill="#FB923C" stroke="#000000" strokeWidth={1} vectorEffect="non-scaling-stroke" />

        {/* 侧端迷你精美文字指示标注 */}
        {renderMiniLabel(r_a_geom, `da`, "#22C55E")}
        {renderMiniLabel(r_geom, `d`, "#38BDF8")}
        {renderMiniLabel(r_b_geom, `db`, "#FB923C")}
        {renderMiniLabel(r_f_geom, `df`, "#F87171")}

        {/* 单齿分度圆齿厚标注线 (逆缩放文字，永不臃肿) */}
        <g transform={`translate(${r_geom + 1.2}, 0) scale(${1 / zoom}) rotate(90)`}>
          <text
            x={0}
            y={-8}
            fill="#F59E0B"
            fontFamily="monospace"
            textAnchor="middle"
            className="font-bold select-none"
            style={{ fontSize: '11px' }}
          >
            s = {s_geom.toFixed(3)}
          </text>
        </g>
      </g>
    );
  };

  const t = TRANSLATIONS[lang];

  return (
    <div id="gear-viewer" className="bg-[#050505] rounded-lg border border-[#27272A] flex flex-col h-[400px] md:h-[520px] relative overflow-hidden select-none">
      {/* 顶部控制与视图切换栏 */}
      <div className="bg-[#0F0F12] border-b border-[#27272A] px-4 py-2.5 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-xs font-bold text-[#E4E4E7] tracking-wider uppercase">{t.gv_title}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* 运动控制 (仅在全轮模式 & 啮合启用时展示) */}
          {viewerMode === 'full' && matingParams.enabled && (
            <div className="flex items-center gap-2 border-r border-[#27272A] pr-3">
              <span className="text-2xs font-semibold text-[#A1A1AA] hidden xs:inline">{t.gv_mating_linkage}</span>
              <button
                onClick={() => onRenderOptionsChange({ ...renderOptions, animate: !renderOptions.animate })}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-2xs font-bold transition-all ${
                  renderOptions.animate
                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                    : 'bg-[#27272A] text-white hover:bg-[#3E3E42]'
                }`}
              >
                {renderOptions.animate ? t.gv_pause : t.gv_simulate}
              </button>
            </div>
          )}

          {/* SVG 1:1 Vector Export Button */}
          <button
            onClick={downloadSVG}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-2xs font-bold rounded-sm transition-all"
            title={lang === 'zh' ? '导出 1:1 公制高精度 CAD 直切 SVG 矢量图' : 'Export 1:1 Metric precision CAD ready SVG vector'}
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{lang === 'zh' ? '下载 1:1 SVG' : 'Download 1:1 SVG'}</span>
          </button>
        </div>
      </div>

      {/* 缩放控制浮动栏 */}
      <div className="absolute top-16 left-4 z-10 flex items-center gap-1 bg-[#0F0F12]/90 backdrop-blur-sm p-1 rounded-sm border border-[#27272A]">
        <button
          onClick={handleZoomIn}
          className="p-1.5 text-[#A1A1AA] hover:text-amber-500 hover:bg-[#18181B] rounded-sm transition-colors"
          title={t.gv_zoom_in}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 text-[#A1A1AA] hover:text-amber-500 hover:bg-[#18181B] rounded-sm transition-colors"
          title={t.gv_zoom_out}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetZoom}
          className="p-1.5 text-[#A1A1AA] hover:text-amber-500 hover:bg-[#18181B] rounded-sm transition-colors"
          title={t.gv_reset_view}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <span className="h-3.5 w-px bg-[#27272A] mx-1"></span>
        <div className="px-1.5 font-mono text-3xs text-[#71717A]">
          {t.gv_zoom} {(zoom * 10).toFixed(0)}%
        </div>
      </div>

      {/* 主画布拖拽区域 */}
      <div
        ref={dragAreaRef}
        className="w-full flex-1 relative cursor-grab active:cursor-grabbing outline-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          {/* 轴心原点和网格缩放平移组 */}
          <g transform={`translate(${260 + pan.x}, ${240 + pan.y}) scale(${zoom})`}>
            {/* 1. 正交背景网格 */}
            {renderGridLines()}
            
            {/* 轴心十字坐标轴线 */}
            <line x1={-30} y1={0} x2={30} y2={0} stroke="#27272A" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={-30} x2={0} y2={30} stroke="#27272A" strokeWidth={1} vectorEffect="non-scaling-stroke" />

            {/* ==================== 完整轴轮几何模型 & 多轮传动仿真 ==================== */}
            <>
              {/* 一、绘制副齿轮 (Gear 2) */}
                {matingParams.enabled && gear2Data && (
                  <g transform={`translate(${centerDistance}, 0)`}>
                    {/* 旋转变换 */}
                    <g transform={`rotate(${theta2})`}>
                      <path
                        d={gear2Data.pathData}
                        fill={renderOptions.animate ? 'rgba(113, 113, 122, 0.12)' : 'rgba(113, 113, 122, 0.04)'}
                        stroke="#71717A"
                        strokeWidth={1.5}
                        vectorEffect="non-scaling-stroke"
                        fillRule="evenodd"
                      />
                      <circle cx={0} cy={0} r={gear2Data.calculations.pitchDiameter * 0.2} fill="#18181B" stroke="#71717A" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                    </g>

                    {/* 辅助线 - 齿轮2齿顶圆 */}
                    {renderOptions.showAddendumCircle && (
                      <circle
                        cx={0}
                        cy={0}
                        r={gear2Data.calculations.addendumDiameter / 2}
                        fill="none"
                        stroke="#34D399"
                        strokeWidth={1.2}
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="2,2"
                      />
                    )}
                    {/* 辅助线 - 齿轮2分度圆 */}
                    {renderOptions.showPitchCircle && (
                      <circle
                        cx={0}
                        cy={0}
                        r={gear2Data.calculations.pitchDiameter / 2}
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth={1.2}
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="2,2"
                      />
                    )}
                    {/* 辅助线 - 齿轮2基圆 */}
                    {renderOptions.showBaseCircle && (
                      <circle
                        cx={0}
                        cy={0}
                        r={gear2Data.calculations.baseDiameter / 2}
                        fill="none"
                        stroke="#FB923C"
                        strokeWidth={1.2}
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="2,4"
                      />
                    )}
                    {/* 辅助线 - 齿轮2齿根圆 */}
                    {renderOptions.showDedendumCircle && (
                      <circle
                        cx={0}
                        cy={0}
                        r={gear2Data.calculations.dedendumDiameter / 2}
                        fill="none"
                        stroke="#F43F5E"
                        strokeWidth={1.2}
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="2,2"
                      />
                    )}
                    <circle cx={0} cy={0} r={4 / zoom} fill="#71717A" stroke="#000000" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  </g>
                )}

                {/* 二、绘制主齿轮 (Gear 1) */}
                <g transform={`rotate(${theta1})`}>
                  <path
                    d={gear1Path}
                    fill={renderOptions.animate ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.03)'}
                    stroke="#F59E0B"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    className="transition-colors duration-150"
                    fillRule="evenodd"
                  />
                </g>

                {/* 3. 主轮辅助圆环参照尺 (不随齿轮自身旋转) */}
                {renderOptions.showAddendumCircle && (
                  <circle
                    cx={0}
                    cy={0}
                    r={gear1.addendumDiameter / 2}
                    fill="none"
                    stroke="#34D399"
                    strokeWidth={1.2}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="2,2"
                  />
                )}
                {renderOptions.showPitchCircle && (
                  <circle
                    cx={0}
                    cy={0}
                    r={gear1.pitchDiameter / 2}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth={1.2}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="2,2"
                  />
                )}
                {renderOptions.showBaseCircle && (
                  <circle
                    cx={0}
                    cy={0}
                    r={gear1.baseDiameter / 2}
                    fill="none"
                    stroke="#FB923C"
                    strokeWidth={1.2}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="2,4"
                  />
                )}
                {renderOptions.showDedendumCircle && (
                  <circle
                    cx={0}
                    cy={0}
                    r={gear1.dedendumDiameter / 2}
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth={1.2}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="2,2"
                  />
                )}
                <circle cx={0} cy={0} r={4 / zoom} fill="#F59E0B" stroke="#000000" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              </>
          </g>
        </svg>
      </div>

       {/* 底部信息标注与技术指标栏 */}
       {isLegendCollapsed ? (
         <button
           onClick={() => setIsLegendCollapsed(false)}
           className="absolute bottom-4 left-4 bg-[#0F0F12]/90 hover:bg-[#18181B] border border-[#27272A] rounded-sm py-1.5 px-3 flex items-center gap-1.5 text-3xs text-[#A1A1AA] hover:text-white transition-all cursor-pointer backdrop-blur-sm shadow-md"
           title={lang === 'zh' ? '展开主齿技术参数' : 'Expand gear specs'}
         >
           <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
           <span className="font-medium">{lang === 'zh' ? '展开齿轮参数 ▾' : 'Primary Specs ▾'}</span>
         </button>
       ) : (
         <div className="absolute bottom-4 left-4 right-4 bg-[#0F0F12]/90 backdrop-blur-sm px-3 md:px-4 py-2.5 rounded-sm border border-[#27272A] flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center text-3xs sm:text-2xs text-[#71717A] gap-2.5 shadow-lg">
           <div className="flex flex-wrap gap-x-4 gap-y-1">
             <div>
               {t.gv_primary_pitch} <b className="font-mono text-white">{gear1.pitchDiameter.toFixed(2)} mm</b>
             </div>
             <div>
               {t.gv_primary_tip} <b className="font-mono text-white">{gear1.addendumDiameter.toFixed(2)} mm</b>
             </div>
             {matingParams.enabled && (
               <>
                 {gear2Data && (
                   <div>
                     {t.gv_mating_tip} <b className="font-mono text-white">{gear2Data.calculations.addendumDiameter.toFixed(2)} mm</b>
                   </div>
                 )}
                 <div>
                   {t.gv_center_dist} <b className="font-mono text-amber-500 font-bold">{centerDistance.toFixed(3)} mm</b>
                 </div>
               </>
             )}
           </div>
           <div className="flex items-center justify-between w-full sm:w-auto gap-4 border-t border-[#27272A]/40 sm:border-t-0 pt-1.5 sm:pt-0 mt-1 sm:mt-0">
             <div className="flex items-center gap-1.5 text-3xs text-[#52525B]">
               <Move className="w-3 h-3 animate-pulse" />
               <span>{t.gv_move_hint}</span>
             </div>
             <button
               onClick={() => setIsLegendCollapsed(true)}
               className="text-[#A1A1AA] hover:text-white text-3xs bg-[#18181B] hover:bg-[#27272A] px-2 py-0.5 rounded-sm border border-[#27272A] select-none transition-colors ml-auto cursor-pointer"
             >
               {lang === 'zh' ? '收起 ▴' : 'Collapse ▴'}
             </button>
           </div>
         </div>
       )}
    </div>
  );
}
