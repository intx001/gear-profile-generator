# ⚙️ 高精度渐开线齿轮几何发生器 / High-Precision Involute Gear Profile Generator

[中文](#chinese) | [English](#english)

---

<a name="chinese"></a>

## 🇨🇳 中文项目介绍

### 🌟 项目简介
这是一个基于网页端、面向工业齿轮几何设计与联动仿真的高精度**渐开线直齿轮几何物理发生器与仿真探究平台**。

系统对渐开线齿部型线、变位补偿、减重空腔、轴孔键槽等进行底层精确的几何数学建模。它能提供实时的 SVG 像素级渲染、动态双齿轮啮合联动仿真、详尽硬核的尺寸数据分析，并提供 **一键导出高精度 1:1 物理级公制标准 SVG 矢量文件** 的功能。导出的矢量文件专门针对 CNC、激光切割和 CAD 制图进行了优化，可直接导入 AutoCAD、Fusion 360、SolidWorks 或 LightBurn 等工业软件，实现快速原型制造。

---

### 🎨 核心功能特性

#### 1. 精密渐开线数学建模 (Involute Tooth Profile Modeling)
- **参数解耦控制**：支持自定义模数（$m$）、齿数（$z$）、压力角/齿形角（$\alpha$），以及径向变位系数（$x$）等核心几何参数。
- **齿顶高与顶隙系数调节**：支持手动按需定制齿顶高系数（$h_a^*$）及顶隙系数（$c^*$）。
- **齿根平滑过渡与根切提示**：齿根过渡曲线采用高平滑圆弧过渡。当输入的齿数过小存在制造根切隐患时，系统提供精细的可视化根切安全提示及变位修正建议。

#### 2. 轻量化与腔体切削样式 (Relief Web Style)
*为了减少转动惯量与节省材料，系统提供齿腹减重孔一键多维解算：*
- **无孔实体盘 (Solid)**：传统的平整实体齿轮盘。
- **环向圆形减轻孔 (Circular Pattern)**：环向均匀阵列的大骨架减轻圈，支持多级数量与孔径辐射比例自定义。
- **骨骼辐射扇区掏空 (Skeletal Sector Truss)**：带有承载加强筋肋骨的空腔扇区结构，能在高强度减重的同时提供坚实受力支撑。

#### 3. 轴孔与标准键槽设定 (Shaft Bores & Keyway)
- 支持定制内部传动轴底圆直径。
- 精确计算并叠加标准的矩形传动键槽（Keyway Width & Depth），模拟齿轮与动力马达轴承的卡位契合度。

#### 4. 动态双联动啮合仿真 (Active Intermesh Simulation)
- 一键开启**配对齿轮（Gear 2）仿真层**，独立定制配对副齿轮的齿数以及径向变位参数。
- 支持模拟咬合运动旋转，配合自定义动态转速调节、播放/暂停、复位及手动角度微调。
- 自动精密计算配对下的真实无侧隙理论变位中心轴距（Center Distance），供检查齿廓干涉。

#### 5. 1:1 高精度 SVG 矢量文件导出 (Physical Scale SVG Vector Download)
- **一键下载**：在画布顶部右上角集成了 “下载 1:1 SVG” 功能，直接生成对应主齿轮的物理比例矢量线稿。
- **工业直切级优化**：
  - 导出图形不带任何背景、文字标注，只保留精密齿廓与孔腔分界线。
  - 采用 `fill-rule="evenodd"` 填充规则，自动求差去并，齿轮轮廓、轴孔、键槽和减轻腔体等组合孔洞层次清晰，可直接被切割机路径软件（如 LightBurn, LaserGRBL）完美解析为外挂齿轮框。
  - 使用超细黑色实线描边（`stroke="#000000" stroke-width="0.2"`），符合主流激光切割、数控雕刻床等设备 CAD 直切标定规则。

#### 6. 交互式画布与特征辅助圆 (Interactive Canvas & Reference Guides)
- 具备高空拖拽平移、滚轮无级缩放高精密渲染画布。
- 集成高对比度坐标对齐网格，可单独开启或隐藏关键工艺图层：
  - **分度圆 d** (蓝色虚线)：齿轮的几何参考设计圈
  - **基圆 db** (橘色虚线)：生成渐开线所包络的底圆柱面
  - **齿顶圆 da** (绿色实线)：齿轮最外围边缘界线
  - **齿根圆 df** (红褐色虚线)：齿槽最低圈线

#### 7. 实时工艺尺寸计算面板 (Real-Time Engineering Metrics)
- 支持**公制 (mm)** 与 **英制 (inch)** 双标准快速切换。
- 精准解析输出：分度圆直径、基圆直径、齿顶圆直径、齿根圆直径、分度圆齿厚、圆周齿距、基圆齿距以及单齿高度。

---

### 📚 物理几何公式参考

在系统底层，渐开线算法主要依据以下国家与国际几何标准展开精确推导：
- **分度圆直径 (Pitch Diameter)**：
  $$d = m \times z$$
- **基圆直径 (Base Diameter)**：
  $$d_b = d \times \cos(\alpha)$$
- **标准/变位 齿顶圆直径 (Addendum Diameter)**：
  $$d_a = m \times (z + 2 \times h_a^* + 2 \times x)$$
- **标准/变位 齿根圆直径 (Dedendum Diameter)**：
  $$d_f = m \times (z - 2 \times h_a^* - 2 \times c^* + 2 \times x)$$
- **合拍中心轴距 (Center Distance)**：
  $$a = \frac{m \times (z_1 + z_2)}{2} + m \times (x_1 + x_2)$$

---

<br />

<a name="english"></a>

## 🇺🇸 English Project Introduction

### 🌟 Project Brief
An interactive, high-precision web-based **Involute Spur Gear Geometric Generator & Twin-Gear Mesh Simulation Platform**.

Built with dedicated mathematical modeling, this platform constructs precise coordinate paths representing ideal mathematical involute curves, radial profile shifts ($x$), torque keyway bores, and skeletal lightweight web layouts. Moving beyond static graphics, it includes a **1:1 Scale Metric SVG Vector Export Tool** on the top of the canvas, rendering ready-to-use vector shapes for direct physical fabrication. The generated vector paths can be easily imported into mechanical designing softwares like AutoCAD, Fusion 360, SolidWorks, or laser-programming drivers such as LightBurn.

---

### 🎨 Key Features

#### 1. Precision Involute Tooth Geometry
- **Parametric Controls**: Fine-tune fundamental variables including Modulus ($m$), Numbers of Teeth ($z$), Pressure Angle ($\alpha$), and Profile Shift Coefficient ($x$).
- **Custom Addendums & Clearances**: Tweak addendum coefficients ($h_a^*$) and dedicated clearance factors ($c^*$) to evaluate tailored mechanical assemblies.
- **Smooth Root Fillets & Undercut Logic**: Dynamically maps curved segments into tooth corners to suppress stress concentrations, and alerts users immediately with visual warnings once teeth counts drop below safe limits.

#### 2. Specialized Weight Relief & Webs
*Toggle skeletal layouts inside the gear's passive web area to minimize mass and rotational inertia:*
- **Solid Gear Face**: Flat solid gear profile.
- **Circular Pocket Pattern**: Radial array of circular weight relief cutouts with controllable counts and size bounds.
- **Skeletal Sector Truss**: Structural spoke rib network built to guarantee structural stiffness while optimizing lightweight gains.

#### 3. Customizable Shaft Bore & Keyway
- Customize the centerpiece core bore diameter to emulate custom motor spindle fitting.
- Configure standardized rectangular drive **Keyways** (width & depth specs) on the main bore of the gear layout.

#### 4. Active Twin-Gear Meshing Dynamics
- Turn on the **Partner Gear (Gear 2)** preview with separate teeth and shift settings.
- Animates continuous joint rotations with adjustable speed multipliers, rotational resets, and manual angular tweaks.
- Automatically calculates and matches the precise tight-mating mesh **Center Distance** across standard or shifted states.

#### 5. 1:1 Precision SVG Vector Export
- **One-Click Download**: Features a dedicated "Download 1:1 SVG" utility in the top-right header of the canvas viewer.
- **Fabrication-Ready Vector Mapping**:
  - The exported file omits grid layouts, dimensions, boundaries and annotation texts to deliver clean vector paths of the customized gear geometry.
  - Implements the strict SVG `fill-rule="evenodd"` parameters to subtract internal shafts, keyways, and skeletal cutouts from the outer gear boundary, yielding robust paths instantly readable by slicing utilities (e.g. LightBurn, LaserGRBL, etc.).
  - Styled with continuous ultra-fine black wires (`stroke="#000000" stroke-width="0.2" fill="none"`), which complies with common CAD and CNC path constraints.

#### 6. Zoomable Interactive Canvas & Grid
- Infinite panning and frictionless mousewheel zooming to review intricate curve meshes.
- Precision aligned background grid alongside togglable color-coded geometric reference layers:
  - **Pitch Circle d** (Dashed blue): Baseline reference diameter circle.
  - **Base Circle db** (Dashed orange): Base cylinder from which the involute curves generate.
  - **Tip Circle da** (Solid green): Outermost boundary cylinder of the teeth profile.
  - **Root Circle df** (Dashed red-brown): Innermost boundary curve at the tooth bottom.

#### 7. Comprehensive Metrics Layout
- Seamlessly transition measurements between **Metric (mm)** and **Imperial (inch)** units.
- Inspect detailed physical dimensions directly: Pitch diameters, base diameters, addendum/dedendum diameters, tooth thickness, circular pitch, and undercut limits.

---

### 📚 Core Geometrical References

The math kernel calculates exact teeth vectors under standard mechanical standards:
- **Pitch Diameter**:
  $$d = m \times z$$
- **Base Diameter**:
  $$d_b = d \times \cos(\alpha)$$
- **Addendum Diameter**:
  $$d_a = m \times (z + 2 \times h_a^* + 2 \times x)$$
- **Dedendum Diameter**:
  $$d_f = m \times (z - 2 \times h_a^* - 2 \times c^* + 2 \times x)$$
- **Joint Center Distance**:
  $$a = \frac{m \times (z_1 + z_2)}{2} + m \times (x_1 + x_2)$$

---

## 🛠️ Technology Stack

- **Application Structure**: React 18, TypeScript, Vite
- **Mathematics Logic**: Native Cartesian-Polar coordinate generation matrices
- **Styles & Layout**: Responsive utility class styling centered on warm slate card formats with optimized responsive mobile headers
- **Interactions & Canvas**: Multi-touch reactive Vector SVG math with native file download support
- **Icons**: Lucide React

---

## 🚀 Local Run Mode

1. **Install Base Packages**:
   ```bash
   npm install
   ```

2. **Launch Dev Workspace**:
   ```bash
   npm run dev
   ```

3. **Production Prep**:
   ```bash
   npm run build
   ```
