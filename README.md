# ⚙️ 高精度渐开线齿轮几何发生引擎/High-Precision Involute Gear Geometry Generator
<img width="1236" height="796" alt="image" src="https://github.com/user-attachments/assets/b4fd6d32-155d-41c5-b20b-017ac93ea8d2" />

[中文](#chinese) | [English](#english)

---

<a name="chinese"></a>

## 🇨🇳 中文介绍

### 🌟 项目简介
这是一个基于网页端、面向工业齿轮几何计算与联动仿真的高精度**渐开线直齿轮几何物理发生器与仿真探究平台**。

系统对渐开线齿部型线、变位补偿、减重空腔、轴孔键槽等进行底层精确的几何数学建模。它能提供实时的 SVG 向量渲染、动态双齿轮啮合联动仿真、详尽硬核的尺寸与应力根切状态数据分析。

---

### 🎨 核心功能特性

#### 1. 精密渐开线数学建模 (Involute Tooth Profile Modeling)
- **参数解耦控制**：支持自定义模数（$m$）、齿数（$z$）、压力角/齿形角（$\alpha$），以及径向变位系数（$x$）等核心几何参数。
- **齿顶高与顶隙系数调节**：支持手动按需定制齿顶高系数（$h_a^*$）及顶隙系数（$c^*$）。
- **齿根平滑过渡与根切提示**：齿根过渡曲线采用高平滑圆曲弧过渡。当输入的齿数过小存在制造根切隐患时，系统提供精细的可视化根切安全提示。

#### 2. 轻量化与腔体切削样式 (Relief Web Style)
*为了减少转动惯量与节省耗材，系统提供齿腹减重孔一键多维解算：*
- **无孔实体盘 (Solid)**：传统的平整实体齿轮盘。
- **环向圆形打雷孔 (Circular Pattern)**：环向均匀阵列的大骨架减轻圈，支持多级数量与孔径辐射比例自定义。
- **骨骼辐射扇区掏空 (Skeletal Sector Truss)**：带有承载加强筋肋骨的空腔扇区结构，能在高强度减重的同时提供坚实受力支撑。

#### 3. 轴孔与标准键槽设定 (Shaft Bores & Keyway)
- 支持定制内部传动轴底圆直径。
- 精确计算并叠加标准的矩形传动键槽（Keyway Width & Depth），模拟齿轮与动力马达轴承的卡位契合度。

#### 4. 动态双联动啮合仿真 (Active Intermesh Simulation)
- 一键开启**配对齿轮（Gear 2）仿真层**，独立定制配对副齿轮的齿数以及径向变位参数。
- 支持模拟咬合运动旋转，配合自定义动态转速调节、播放/暂停、复位。
- 自动精密计算配对下的真实无侧隙理论变位中心轴距（Center Distance），供检查齿廓干涉。

#### 5. 交互式画布与特征辅助圆 (Interactive Canvas & Reference Guides)
- 具备高空拖拽平移、滚轮无级缩放高精密渲染画布。
- 集成高对比度坐标对齐网格，可单独开启或隐藏关键工艺图层：
  - **分度圆 d** (蓝色虚线)
  - **基圆 db** (橘色虚线)
  - **齿顶圆 da** (绿色实线)
  - **齿根圆 df** (红褐色虚线)

#### 6. 实时工艺尺寸计算面板 (Real-Time Engineering Metrics)
- 支持**公制 (mm)** 与 **英制 (inch)** 双标准快速切换。
- 精准解析输出：分度圆直径、基圆直径、齿顶圆直径、齿根圆直径、齿距、分度圆齿厚、基圆齿距，以及齿轮无根切的最小变位推荐齿数等。

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

## 🇺🇸 English Introduction

### 🌟 Project Brief
An interactive, high-precision web-based **Involute Spur Gear Geometric Generator & Twin-Gear Mesh Simulation Platform**. 

Built with dedicated mathematical modeling, it constructs precise coordinate paths representing ideal mathematical involute curves, radial profile shifts ($x$), torque keyway bores, and skeletal lightweight web layouts. Coupled with highly detailed engineering calculators and a real-world unit toggle, it is a master class simulation framework for mechanical engineers and digital fabricators alike.

---

### 🎨 Key Features

#### 1. Precision Involute Tooth Geometry
- **Parametric Controls**: Fine-tune fundamental variables including Modulus ($m$), Numbers of Teeth ($z$), Pressure Angle ($\alpha$), and Profile Shift Coefficient ($x$).
- **Custom Addendums & Clearances**: Tweak addendum coefficients ($h_a^*$) and dedicated clearance factors ($c^*$) to evaluate tailored mechanical assemblies.
- **Smooth Root Fillets & Undercut Logic**: Dynamically maps curved segments into tooth corners to suppress stress concentrations, and sounds visual undercut warnings once teeth counts enter risk zones.

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

#### 5. Zoomable Interactive Canvas & Grid
- Infinite panning and frictionless mousewheel zooming to review intricate curve meshes.
- Precision aligned background grid alongside togglable color-coded geometric reference layers:
  - **Pitch Circle d** (Dashed blue)
  - **Base Circle db** (Dashed orange)
  - **Tip Circle da** (Solid green)
  - **Root Circle df** (Dashed red-brown)

#### 6. Comprehensive Metrics calculator
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
- **Styles & Layout**: Responsive utility class styling centered on warm slate card formats
- **Interactions & Canvas**: Multi-touch reactive Vector SVG math
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
