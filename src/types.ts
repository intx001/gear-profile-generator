export type SpokeType = 'none' | 'circle' | 'sector';

export interface GearParams {
  modulus: number;         // 模数 m (mm)
  teeth: number;           // 齿数 z
  pressureAngle: number;   // 压力角/齿形角 alpha (度, e.g., 20)
  profileShift: number;    // 径向变位系数 x (无纲量)
  addendumCoeff: number;   // 齿顶高系数 ha* (e.g., 1.0)
  clearanceCoeff: number;  // 齿顶隙系数 c* (e.g., 0.25)
  filletCoeff: number;     // 齿根过渡圆角系数 rf* (e.g., 0.38)
  customTipDiameter?: number; // 用户自定义的齿顶圆直径 override (mm)
  
  // 轴孔与键槽
  shaftDiameter: number;   // 轴孔直径 d_shaft (mm)
  hasKeyway: boolean;      // 是否有键槽
  keywayWidth: boolean | number; // 键槽宽度 b (mm)
  keywayDepth: number;     // 键槽深度 t1 (mm) (从轴孔圆周算起的深度)
  
  // 减重设计
  spokeType: SpokeType;    // 减重孔类型
  spokesCount: number;     // 减重孔/辐条数量
  spokeRatio: number;      // 减重孔大小占比 (0.1 - 0.9)
  
  // 制造补偿
  kerf: number;            // 激光切割缝宽 (mm), 用于路径向外膨胀补偿
}

export interface MatingGearParams {
  enabled: boolean;        // 是否启用配对齿轮进行仿真
  teeth: number;           // 配对齿轮齿数 z2
  profileShift: number;    // 配对齿轮变位系数 x2
  rotationAngle: number;   // 旋转角度 (度)，用于手动微调或动画
  customCenterDistance?: number; // 用户自定义的中心距 override (mm)
  addendumCoeff: number;   // 配对齿轮齿顶高系数 ha* (e.g., 1.0)
  clearanceCoeff: number;  // 配对齿轮齿顶隙系数 c* (e.g., 0.25)
  customTipDiameter?: number; // 配对齿轮用户自定义的齿顶圆直径 override (mm)
}

export interface RenderOptions {
  showPitchCircle: boolean;     // 显示分度圆 (蓝色虚线)
  showBaseCircle: boolean;      // 显示基圆 (橘色虚线)
  showAddendumCircle: boolean;  // 显示齿顶圆
  showDedendumCircle: boolean;  // 显示齿根圆
  showGrid: boolean;            // 显示方格背景
  animate: boolean;             // 动画旋转中
  playbackSpeed: number;        // 仿真播放速度
  unit: 'mm' | 'inch';          // 尺寸单位
  exportScale: number;          // 导出缩放 (一般 1.0)
}

export interface GearCalculations {
  pitchDiameter: number;        // 分度圆直径 d = m * z
  baseDiameter: number;         // 基圆直径 db = d * cos(alpha)
  addendumDiameter: number;     // 齿顶圆直径 da = d + 2 * (ha* + x) * m
  dedendumDiameter: number;     // 齿根圆直径 df = d - 2 * (ha* + c* - x) * m
  pitch: number;                // 齿距 p = pi * m
  toothThickness: number;       // 分度圆齿厚 s = m * (pi/2 + 2*x*tan(alpha))
  basePitch: number;            // 基圆齿距 pb = p * cos(alpha)
  undercutLimit: number;        // 根切极限齿数 z_min = 2 * ha* / sin^2(alpha)
  hasUndercutWarning: boolean;  // 是否有根切风险 (当 z < z_min * (1 - x) 时)
}
