import { GearParams, GearCalculations, SpokeType } from '../types';

export function calculateGear(params: GearParams): GearCalculations {
  const { modulus, teeth, pressureAngle, profileShift, addendumCoeff, clearanceCoeff } = params;
  
  // 压力角转弧度
  const alphaRad = (pressureAngle * Math.PI) / 180;
  
  // 分度圆直径 d = m * z
  const pitchDiameter = modulus * teeth;
  
  // 基圆直径 db = d * cos(alpha)
  const baseDiameter = pitchDiameter * Math.cos(alphaRad);
  
  // 齿顶圆直径 da = d + 2 * (ha* + x) * m
  const addendumDiameter = typeof params.customTipDiameter === 'number'
    ? params.customTipDiameter
    : pitchDiameter + 2 * (addendumCoeff + profileShift) * modulus;
  
  // 齿根圆直径 df = d - 2 * (ha* + c* - x) * m
  const dedendumDiameter = pitchDiameter - 2 * (addendumCoeff + clearanceCoeff - profileShift) * modulus;
  
  // 齿距 p = pi * m
  const pitch = Math.PI * modulus;
  
  // 分度圆齿厚 s = m * (pi/2 + 2*x*tan(alpha))
  const toothThickness = modulus * (Math.PI / 2 + 2 * profileShift * Math.tan(alphaRad));
  
  // 基圆齿距 pb = p * cos(alpha)
  const basePitch = pitch * Math.cos(alphaRad);
  
  // 根切极限齿数 (不发生根切的最小齿数，标准齿轮为 2 * ha* / sin^2(alpha))
  const undercutLimit = (2 * addendumCoeff) / Math.pow(Math.sin(alphaRad), 2);
  
  // 实际是否发生根切: 如果 z < (2 * (ha* - x)) / sin^2(alpha)
  const realUndercutLimit = (2 * (addendumCoeff - profileShift)) / Math.pow(Math.sin(alphaRad), 2);
  const hasUndercutWarning = teeth < realUndercutLimit;
  
  return {
    pitchDiameter,
    baseDiameter,
    addendumDiameter,
    dedendumDiameter,
    pitch,
    toothThickness,
    basePitch,
    undercutLimit,
    hasUndercutWarning,
  };
}

export interface Point2D {
  x: number;
  y: number;
}

// 渐开线函数
// inv(alpha) = tan(alpha) - alpha
function inv(alphaRad: number): number {
  return Math.tan(alphaRad) - alphaRad;
}

/**
 * 局部法线偏移，用于激光切割割缝补偿 (Kerf Compensation)
 * 沿着向外的法线方向平移多边形顶点
 */
export function applyKerfCompensation(points: Point2D[], kerf: number, isInner: boolean = false): Point2D[] {
  if (kerf <= 0) return points;
  const offset = kerf / 2; // 向外（或内）扩展多少 mm
  const n = points.length;
  if (n < 3) return points;

  const compensated: Point2D[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    // 计算相邻边的切向
    const t1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const t2 = { x: next.x - curr.x, y: next.y - curr.y };

    // 归一化
    const len1 = Math.hypot(t1.x, t1.y) || 1;
    const len2 = Math.hypot(t2.x, t2.y) || 1;
    t1.x /= len1; t1.y /= len1;
    t2.x /= len2; t2.y /= len2;

    // 顶点的平均切向
    const tx = (t1.x + t2.x) / 2;
    const ty = (t1.y + t2.y) / 2;
    
    // 计算法向 (指向右边)
    let nx = ty;
    let ny = -tx;
    const nLen = Math.hypot(nx, ny) || 1;
    nx /= nLen;
    ny /= nLen;

    // 确定外指向:
    // 对于外齿廓，常规范数应与径向点向量 (curr.x, curr.y) 同向
    // 对于内圆/键槽，常规范数应根据 isInner 设定
    const dot = nx * curr.x + ny * curr.y;
    if (isInner) {
      // 内孔：向里缩（即往圆心方向补偿）
      if (dot > 0) {
        nx = -nx;
        ny = -ny;
      }
    } else {
      // 外齿廓：向外胀（即背离圆心方向补偿）
      if (dot < 0) {
        nx = -nx;
        ny = -ny;
      }
    }

    compensated.push({
      x: curr.x + nx * offset,
      y: curr.y + ny * offset,
    });
  }

  return compensated;
}

/**
 * 生成外齿廓封闭曲线点集 (CCW, 逆时针运动)
 */
export function generateGearOuterOutline(params: GearParams): Point2D[] {
  const { modulus, teeth, pressureAngle, profileShift, addendumCoeff, clearanceCoeff, filletCoeff } = params;
  
  const alphaRad = (pressureAngle * Math.PI) / 180;
  const z = teeth;
  const m = modulus;
  
  // 各圆半径
  const r = (m * z) / 2;                         // 分度圆半径
  const r_b = r * Math.cos(alphaRad);             // 基圆半径
  const r_a = typeof params.customTipDiameter === 'number'
    ? params.customTipDiameter / 2
    : r + (addendumCoeff + profileShift) * m;    // 齿顶圆半径
  const r_f = r - (addendumCoeff + clearanceCoeff - profileShift) * m; // 齿根圆半径
  
  // 齿顶过渡圆角半径 (最大设为齿根空隙的合理宽度)
  const R_f = Math.max(0, filletCoeff * m);
  
  // 变位下的齿厚分度圆弧度
  // s = m * (pi/2 + 2*x*tan(alpha))
  const s = m * (Math.PI / 2 + 2 * profileShift * Math.tan(alphaRad));
  const psi = s / r; // 齿厚对应的分度圆中心角
  const deltaTheta = psi / 2; // 齿厚半角
  
  const invAlpha = inv(alphaRad);
  
  // 渐开线在何处截止
  // 渐开线从 r_b 开始；齿根在 r_f。
  // 若 r_f < r_b，则从 r_b 到 r_f 额外用一根径向直线/过渡圆角连接。
  // 若 r_f >= r_b，则从 r_f 直接开始渐开线。
  const r_involute_start = Math.max(r_b, r_f);
  
  // 渐开线参数 t_min 和 t_max
  const t_min = r_f > r_b ? Math.sqrt(Math.pow(r_f / r_b, 2) - 1) : 0;
  const t_max = r_a > r_b ? Math.sqrt(Math.pow(r_a / r_b, 2) - 1) : 0;
  
  // 齿根过渡圆角的几何
  // 圆角 tangent 处的半径: r_tangent = sqrt(rf^2 + 2 * rf * Rf)
  let r_tangent = r_f;
  let delta = 0;
  if (R_f > 0) {
    r_tangent = Math.sqrt(r_f * r_f + 2 * r_f * R_f);
    // 判断圆周约束，防止 fillet 过于宽大
    const sinArg = R_f / (r_f + R_f);
    if (sinArg < 1) {
      delta = Math.asin(sinArg);
    }
  }
  
  const pitchAngle = (2 * Math.PI) / z; // 齿距角
  const points: Point2D[] = [];
  
  // 采样精度
  const N_inv = 48;  // 渐开线单侧采样点数
  const N_tip = 16;   // 齿顶圆弧采样
  const N_fillet = 20; // 圆角采样
  const N_root = 20;  // 齿根圆弧采样
  
  for (let k = 0; k < z; k++) {
    const phi_k = k * pitchAngle; // 当前齿中心线角度
    
    // ============================================
    // 1. 左侧渐开线 (从 root/tangent 爬升到 tip)
    // ============================================
    // 如果 r_tangent 大于 r_involute_start，则渐开线应该从 r_tangent 对应参数开始；
    // 否则从 t_min 开始。
    const t_start_left = r_tangent > r_involute_start 
      ? Math.sqrt(Math.max(0, Math.pow(Math.min(r_tangent, r_a), 2) / (r_b * r_b) - 1)) 
      : t_min;
    const theta_line_left = phi_k + deltaTheta + invAlpha - (t_start_left - Math.atan(t_start_left));
    
    // 缝合径向过渡连线：如果 r_tangent < r_involute_start，说明存在一段从 r_tangent 到 r_involute_start 的直线过渡。
    points.push({
      x: r_tangent * Math.cos(theta_line_left),
      y: r_tangent * Math.sin(theta_line_left)
    });
    if (r_tangent < r_involute_start) {
      points.push({
        x: r_involute_start * Math.cos(theta_line_left),
        y: r_involute_start * Math.sin(theta_line_left)
      });
    }

    // 渐开线上点
    for (let i = 0; i <= N_inv; i++) {
      const u = i / N_inv;
      const t = t_start_left + (t_max - t_start_left) * u;
      const r_t = r_b * Math.sqrt(1 + t * t);
      const theta_t = phi_k + deltaTheta + invAlpha - (t - Math.atan(t));
      points.push({
        x: r_t * Math.cos(theta_t),
        y: r_t * Math.sin(theta_t)
      });
    }
    
    // ============================================
    // 2. 齿顶圆弧 (在齿顶圆半径 r_a 上，左侧到右侧)
    // ============================================
    const theta_tip_left = phi_k + deltaTheta + invAlpha - (t_max - Math.atan(t_max));
    const theta_tip_right = phi_k - deltaTheta - invAlpha + (t_max - Math.atan(t_max));
    for (let i = 1; i < N_tip; i++) {
      const u = i / N_tip;
      const theta = (1 - u) * theta_tip_left + u * theta_tip_right;
      points.push({
        x: r_a * Math.cos(theta),
        y: r_a * Math.sin(theta)
      });
    }
    
    // ============================================
    // 3. 右侧渐开线 (从 tip 下降到 root)
    // ============================================
    const t_start_right = r_tangent > r_involute_start 
      ? Math.sqrt(Math.max(0, Math.pow(Math.min(r_tangent, r_a), 2) / (r_b * r_b) - 1)) 
      : t_min;
    
    for (let i = 0; i <= N_inv; i++) {
      const u = i / N_inv;
      const t = t_max - (t_max - t_start_right) * u;
      const r_t = r_b * Math.sqrt(1 + t * t);
      const theta_t = phi_k - deltaTheta - invAlpha + (t - Math.atan(t));
      points.push({
        x: r_t * Math.cos(theta_t),
        y: r_t * Math.sin(theta_t)
      });
    }

    const theta_base_right = phi_k - deltaTheta - invAlpha + (t_start_right - Math.atan(t_start_right));
    if (r_tangent < r_involute_start) {
      points.push({
        x: r_involute_start * Math.cos(theta_base_right),
        y: r_involute_start * Math.sin(theta_base_right)
      });
    }
    points.push({
      x: r_tangent * Math.cos(theta_base_right),
      y: r_tangent * Math.sin(theta_base_right)
    });

    // ============================================
    // 4. 齿根圆角 & 齿间圆弧 (右侧过渡到下一齿的左侧)
    // ============================================
    const theta_root_right = phi_k - deltaTheta - invAlpha + (t_start_right - Math.atan(t_start_right));
    const theta_root_left_next = (phi_k + pitchAngle) + deltaTheta + invAlpha - (t_start_left - Math.atan(t_start_left));
    
    const phi_c_right = theta_root_right - delta;          // 齿根右过渡圆心极角
    const phi_c_left_next = theta_root_left_next + delta;   // 齿根下一齿左过渡圆心极角

    // 右侧齿根圆角
    if (R_f > 0) {
      const cx = (r_f + R_f) * Math.cos(phi_c_right);
      const cy = (r_f + R_f) * Math.sin(phi_c_right);
      
      const p_tan = { x: r_tangent * Math.cos(theta_root_right), y: r_tangent * Math.sin(theta_root_right) };
      const p_root = { x: r_f * Math.cos(phi_c_right), y: r_f * Math.sin(phi_c_right) };
      
      const b_start = Math.atan2(p_tan.y - cy, p_tan.x - cx);
      let b_end = Math.atan2(p_root.y - cy, p_root.x - cx);
      
      // 连续性校正
      if (b_end - b_start > Math.PI) b_end -= 2 * Math.PI;
      if (b_start - b_end > Math.PI) b_end += 2 * Math.PI;

      for (let i = 1; i <= N_fillet; i++) {
        const u = i / N_fillet;
        const beta = (1 - u) * b_start + u * b_end;
        points.push({
          x: cx + R_f * Math.cos(beta),
          y: cy + R_f * Math.sin(beta)
        });
      }
    } else {
      // 没圆角，直接接齿根圆
      points.push({
        x: r_f * Math.cos(theta_root_right),
        y: r_f * Math.sin(theta_root_right)
      });
    }

    // 齿根槽底圆弧 (从当前齿右圆角结束，到下一齿左圆角开始)
    // 逆时针，角度应当在增加
    const arc_start_angle = R_f > 0 ? phi_c_right : theta_root_right;
    const arc_end_angle = R_f > 0 ? phi_c_left_next : theta_root_left_next;
    
    for (let i = 1; i < N_root; i++) {
      const u = i / N_root;
      const angle = (1 - u) * arc_start_angle + u * arc_end_angle;
      points.push({
        x: r_f * Math.cos(angle),
        y: r_f * Math.sin(angle)
      });
    }
    
    // 左侧齿根圆角（齿轮 k+1 的左侧起步过渡）
    if (R_f > 0) {
      const cx = (r_f + R_f) * Math.cos(phi_c_left_next);
      const cy = (r_f + R_f) * Math.sin(phi_c_left_next);
      
      const p_root = { x: r_f * Math.cos(phi_c_left_next), y: r_f * Math.sin(phi_c_left_next) };
      const p_tan = { x: r_tangent * Math.cos(theta_root_left_next), y: r_tangent * Math.sin(theta_root_left_next) };
      
      const b_start = Math.atan2(p_root.y - cy, p_root.x - cx);
      let b_end = Math.atan2(p_tan.y - cy, p_tan.x - cx);
      
      // 连续性校正
      if (b_end - b_start > Math.PI) b_end -= 2 * Math.PI;
      if (b_start - b_end > Math.PI) b_end += 2 * Math.PI;

      for (let i = 0; i <= N_fillet; i++) {
        const u = i / N_fillet;
        const beta = (1 - u) * b_start + u * b_end;
        points.push({
          x: cx + R_f * Math.cos(beta),
          y: cy + R_f * Math.sin(beta)
        });
      }
    } else {
      points.push({
        x: r_f * Math.cos(theta_root_left_next),
        y: r_f * Math.sin(theta_root_left_next)
      });
    }
  }
  
  return points;
}

/**
 * 生成内轴孔与键槽的封闭曲线 (CW 顺时针，以便与外齿廓 CCW 组合，支持完美的镂空 SVG 格式)
 */
export function generateShaftOutline(params: GearParams): Point2D[] {
  const { shaftDiameter, hasKeyway, keywayWidth, keywayDepth } = params;
  const r_shaft = shaftDiameter / 2;
  
  if (r_shaft <= 0) return [];
  
  const points: Point2D[] = [];
  const N_shaft = 64;
  
  if (!hasKeyway) {
    // 纯圆孔 (顺时针，角度递减)
    for (let i = 0; i < N_shaft; i++) {
      const angle = (2 * Math.PI) - (i / N_shaft) * (2 * Math.PI);
      points.push({
        x: r_shaft * Math.cos(angle),
        y: r_shaft * Math.sin(angle)
      });
    }
    return points;
  }
  
  // 键槽计算
  const w = typeof keywayWidth === 'number' ? keywayWidth : 3;
  const h = keywayDepth; // 朝着 y 正方向切出去的深度
  
  if (w <= 0 || w >= shaftDiameter) {
    // 键槽无效，退化为圆形
    for (let i = 0; i < N_shaft; i++) {
      const angle = (2 * Math.PI) - (i / N_shaft) * (2 * Math.PI);
      points.push({
        x: r_shaft * Math.cos(angle),
        y: r_shaft * Math.sin(angle)
      });
    }
    return points;
  }
  
  // 圆周与键槽侧壁的交点
  // 键槽左右壁 x = -w/2, x = w/2
  // 交点 y 坐标
  const intersectY = Math.sqrt(r_shaft * r_shaft - (w / 2) * (w / 2));
  const angle_right_intersect = Math.atan2(intersectY, w / 2);
  const angle_left_intersect = Math.atan2(intersectY, -w / 2);
  
  // 1. 生成键槽部分顶点 (顺时针方向：左上 -> 右上 -> 右交点)
  const key_top_y = r_shaft + h;
  const key_left_top = { x: -w / 2, y: key_top_y };
  const key_right_top = { x: w / 2, y: key_top_y };
  const key_right_bot = { x: w / 2, y: intersectY };
  const key_left_bot = { x: -w / 2, y: intersectY };
  
  // 从右交点开始，顺时针绕圆一周直到左交点
  const startAngle = angle_right_intersect;
  // 顺时针，角度在减少。角度跨越 y < 0 区域，最后到左交点。
  let endAngle = angle_left_intersect;
  if (endAngle > startAngle) {
    endAngle -= 2 * Math.PI;
  }
  
  // 采样圆弧部分
  const N_arc = 40;
  for (let i = 0; i <= N_arc; i++) {
    const u = i / N_arc;
    const angle = startAngle * (1 - u) + endAngle * u;
    points.push({
      x: r_shaft * Math.cos(angle),
      y: r_shaft * Math.sin(angle)
    });
  }
  
  // 加入键槽拐角
  points.push(key_left_bot);
  points.push(key_left_top);
  points.push(key_right_top);
  points.push(key_right_bot);
  
  return points;
}

/**
 * 生成减重孔/镂空 (圆孔或扇形槽)。也是顺时针，以便形成内裁。
 */
export function generateSpokesOutlines(params: GearParams): Point2D[][] {
  const { modulus, teeth, shaftDiameter, spokeType, spokesCount, spokeRatio, clearanceCoeff, addendumCoeff, profileShift } = params;
  
  if (spokeType === 'none' || spokesCount <= 0) return [];
  
  const z = teeth;
  const m = modulus;
  const r = (m * z) / 2;
  const r_f = r - (addendumCoeff + clearanceCoeff - profileShift) * m; // 齿根圆半径
  
  const r_shaft_out = shaftDiameter / 2 + 3; // 毂部（外侧）留出至少 3mm 边宽
  const r_rim_in = r_f - 3;                  // 轮毂（内侧）留出至少 3mm 边宽
  
  if (r_rim_in <= r_shaft_out + 2) {
    // 空间太窄，无法生成减重孔
    return [];
  }
  
  const paths: Point2D[][] = [];
  const step = (2 * Math.PI) / spokesCount;
  
  if (spokeType === 'circle') {
    // 均匀分布的圆孔
    const spokeCenterRadius = (r_shaft_out + r_rim_in) / 2;
    const maxHoleRadius = (r_rim_in - r_shaft_out) / 2;
    const holeRadius = maxHoleRadius * spokeRatio;
    
    if (holeRadius < 1) return [];
    
    for (let i = 0; i < spokesCount; i++) {
      const centerAngle = i * step;
      const cx = spokeCenterRadius * Math.cos(centerAngle);
      const cy = spokeCenterRadius * Math.sin(centerAngle);
      
      const circlePoints: Point2D[] = [];
      const N_circle = 32;
      // 顺时针，创建内剪切线
      for (let j = 0; j < N_circle; j++) {
        const theta = 2 * Math.PI - (j / N_circle) * 2 * Math.PI;
        circlePoints.push({
          x: cx + holeRadius * Math.cos(theta),
          y: cy + holeRadius * Math.sin(theta)
        });
      }
      paths.push(circlePoints);
    }
  } else if (spokeType === 'sector') {
    // 扇形框
    // spokeRatio 调节辐条的扇区角度和半径占比
    // 辐条厚度角 = step * (1 - spokeRatio)
    // 限制在合理厚度
    const spokeAngleWidth = Math.max(0.08, step * (1.1 - spokeRatio)); 
    const sectorSweepAngle = step - spokeAngleWidth;
    
    if (sectorSweepAngle < 0.05) return []; // 辐条太厚，没有空间了
    
    const r_inner = r_shaft_out + (r_rim_in - r_shaft_out) * (1 - spokeRatio) * 0.3;
    const r_outer = r_rim_in - (r_rim_in - r_shaft_out) * (1 - spokeRatio) * 0.3;
    
    const cornerRadius = Math.max(0.5, (r_outer - r_inner) * 0.1); // 圆角大小
    
    for (let k = 0; k < spokesCount; k++) {
      const centerAngle = k * step;
      const angle_start = centerAngle + spokeAngleWidth / 2;
      const angle_end = centerAngle + step - spokeAngleWidth / 2;
      
      const sectorPoints: Point2D[] = [];
      const N_side = 12;
      
      // 扇形切区 (顺时针方向: 
      // 1. 外圆角从 angle_start 旋转到 angle_end (r_outer)
      // 2. 右侧径向直边由 r_outer 下降到 r_inner (angle_end)
      // 3. 内圆角从 angle_end 旋转到 angle_start (r_inner)
      // 4. 左侧内边由 r_inner 爬升到 r_outer (angle_start)
      // )
      
      // 我们用高密度轮廓精确拟合
      // 1. 外圆弧 (顺时针，从 angle_end 减小到 angle_start)
      for (let i = 0; i <= N_side; i++) {
        const u = i / N_side;
        // 顺时针：angle_end -> angle_start
        const angle = angle_end * (1 - u) + angle_start * u;
        sectorPoints.push({
          x: r_outer * Math.cos(angle),
          y: r_outer * Math.sin(angle)
        });
      }
      
      // 2. 内圆弧 (顺时针，从 angle_start 增加到 angle_end)
      for (let i = 0; i <= N_side; i++) {
        const u = i / N_side;
        // 顺时针（逆圆弧）：angle_start -> angle_end
        const angle = angle_start * (1 - u) + angle_end * u;
        sectorPoints.push({
          x: r_inner * Math.cos(angle),
          y: r_inner * Math.sin(angle)
        });
      }
      
      paths.push(sectorPoints);
    }
  }
  
  return paths;
}

/**
 * 格式化高精度 polyline points 列表为 SVG `<path>` 描述字段 d
 */
export function pointsToSVGPath(points: Point2D[], closed: boolean = true): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x.toFixed(4)} ${points[0].y.toFixed(4)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(4)} ${points[i].y.toFixed(4)}`;
  }
  if (closed) d += ' Z';
  return d;
}

/**
 * 完整组装齿轮 SVG (包含外齿廓、内齿孔、键槽、以及减重孔)
 * 支持完整的镂空填充规则: fill-rule="evenodd"
 */
export function generateFullGearSVGPath(params: GearParams): { pathData: string, outerCount: number, innerCount: number } {
  // 1. 生成外齿
  const outerRaw = generateGearOuterOutline(params);
  const outerCompensated = applyKerfCompensation(outerRaw, params.kerf, false);
  const outerPath = pointsToSVGPath(outerCompensated, true);
  
  let fullPath = outerPath;
  let innerCount = 0;
  
  // 2. 生成内孔
  const shaftRaw = generateShaftOutline(params);
  if (shaftRaw.length > 0) {
    const shaftCompensated = applyKerfCompensation(shaftRaw, params.kerf, true);
    const shaftPath = pointsToSVGPath(shaftCompensated, true);
    fullPath += ' ' + shaftPath;
    innerCount++;
  }
  
  // 3. 生成减重孔
  const spokesRawList = generateSpokesOutlines(params);
  for (const spokeRaw of spokesRawList) {
    if (spokeRaw.length > 0) {
      const spokeCompensated = applyKerfCompensation(spokeRaw, params.kerf, true);
      const spokePath = pointsToSVGPath(spokeCompensated, true);
      fullPath += ' ' + spokePath;
      innerCount++;
    }
  }
  
  return {
    pathData: fullPath,
    outerCount: outerCompensated.length,
    innerCount: innerCount
  };
}

/**
 * 生成单个齿的对称齿廓 (中心线在 x 轴 theta = 0)
 * 包含左、右渐开线齿廓、齿顶圆弧、齿根过渡圆角以及半个齿槽底圆弧
 */
export function generateSingleToothProfile(params: GearParams): { points: Point2D[], pitchIntersectionLeft: Point2D, pitchIntersectionRight: Point2D, baseIntersectionLeft: Point2D, baseIntersectionRight: Point2D } {
  const { modulus, teeth, pressureAngle, profileShift, addendumCoeff, clearanceCoeff, filletCoeff } = params;
  
  const alphaRad = (pressureAngle * Math.PI) / 180;
  const z = teeth;
  const m = modulus;
  
  const r = (m * z) / 2;                         // 分度圆半径
  const r_b = r * Math.cos(alphaRad);             // 基圆半径
  const r_a = typeof params.customTipDiameter === 'number'
    ? params.customTipDiameter / 2
    : r + (addendumCoeff + profileShift) * m;    // 齿顶圆半径
  const r_f = r - (addendumCoeff + clearanceCoeff - profileShift) * m; // 齿根圆半径
  
  const R_f = Math.max(0, filletCoeff * m);
  const s = m * (Math.PI / 2 + 2 * profileShift * Math.tan(alphaRad));
  const psi = s / r;
  const deltaTheta = psi / 2;
  const invAlpha = Math.tan(alphaRad) - alphaRad;
  
  const r_involute_start = Math.max(r_b, r_f);
  const t_min = r_f > r_b ? Math.sqrt(Math.pow(r_f / r_b, 2) - 1) : 0;
  const t_max = r_a > r_b ? Math.sqrt(Math.pow(r_a / r_b, 2) - 1) : 0;
  
  let r_tangent = r_f;
  let delta = 0;
  if (R_f > 0) {
    r_tangent = Math.sqrt(r_f * r_f + 2 * r_f * R_f);
    const sinArg = R_f / (r_f + R_f);
    if (sinArg < 1) {
      delta = Math.asin(sinArg);
    }
  }
  
  const pitchAngle = (2 * Math.PI) / z;
  const points: Point2D[] = [];
  
  const N_inv = 100;
  const N_tip = 40;
  const N_fillet = 40;
  const N_root = 40;
  
  const t_start_left = r_tangent > r_involute_start 
    ? Math.sqrt(Math.max(0, Math.pow(Math.min(r_tangent, r_a), 2) / (r_b * r_b) - 1)) 
    : t_min;
  const t_start_right = t_start_left;

  const theta_root_left = deltaTheta + invAlpha - (t_start_left - Math.atan(t_start_left));
  const theta_root_right = -deltaTheta - invAlpha + (t_start_right - Math.atan(t_start_right));
  
  const phi_c_left = theta_root_left + delta;
  const phi_c_right = theta_root_right - delta;
  
  // 1. 左侧一半槽底圆弧
  const left_slot_angle = pitchAngle / 2;
  for (let i = 0; i <= N_root / 2; i++) {
    const u = i / (N_root / 2);
    const angle = left_slot_angle * (1 - u) + phi_c_left * u;
    points.push({
      x: r_f * Math.cos(angle),
      y: r_f * Math.sin(angle)
    });
  }
  
  // 2. 左齿根圆角
  if (R_f > 0) {
    const cx = (r_f + R_f) * Math.cos(phi_c_left);
    const cy = (r_f + R_f) * Math.sin(phi_c_left);
    const p_root = { x: r_f * Math.cos(phi_c_left), y: r_f * Math.sin(phi_c_left) };
    const p_tan = { x: r_tangent * Math.cos(theta_root_left), y: r_tangent * Math.sin(theta_root_left) };
    
    const b_start = Math.atan2(p_root.y - cy, p_root.x - cx);
    let b_end = Math.atan2(p_tan.y - cy, p_tan.x - cx);
    if (b_end - b_start > Math.PI) b_end -= 2 * Math.PI;
    if (b_start - b_end > Math.PI) b_end += 2 * Math.PI;
    
    for (let i = 1; i <= N_fillet; i++) {
      const u = i / N_fillet;
      const beta = (1 - u) * b_start + u * b_end;
      points.push({
        x: cx + R_f * Math.cos(beta),
        y: cy + R_f * Math.sin(beta)
      });
    }
  } else {
    points.push({
      x: r_f * Math.cos(theta_root_left),
      y: r_f * Math.sin(theta_root_left)
    });
  }
  
  // 3. 左侧渐开线
  points.push({
    x: r_tangent * Math.cos(theta_root_left),
    y: r_tangent * Math.sin(theta_root_left)
  });
  if (r_tangent < r_involute_start) {
    points.push({
      x: r_involute_start * Math.cos(theta_root_left),
      y: r_involute_start * Math.sin(theta_root_left)
    });
  }
  for (let i = 0; i <= N_inv; i++) {
    const u = i / N_inv;
    const t = t_start_left + (t_max - t_start_left) * u;
    const r_t = r_b * Math.sqrt(1 + t * t);
    const theta_t = deltaTheta + invAlpha - (t - Math.atan(t));
    points.push({
      x: r_t * Math.cos(theta_t),
      y: r_t * Math.sin(theta_t)
    });
  }
  
  // 4. 齿顶圆弧
  const theta_tip_left = deltaTheta + invAlpha - (t_max - Math.atan(t_max));
  const theta_tip_right = -deltaTheta - invAlpha + (t_max - Math.atan(t_max));
  for (let i = 1; i < N_tip; i++) {
    const u = i / N_tip;
    const theta = (1 - u) * theta_tip_left + u * theta_tip_right;
    points.push({
      x: r_a * Math.cos(theta),
      y: r_a * Math.sin(theta)
    });
  }
  
  // 5. 右侧渐开线
  for (let i = 0; i <= N_inv; i++) {
    const u = i / N_inv;
    const t = t_max - (t_max - t_start_right) * u;
    const r_t = r_b * Math.sqrt(1 + t * t);
    const theta_t = -deltaTheta - invAlpha + (t - Math.atan(t));
    points.push({
      x: r_t * Math.cos(theta_t),
      y: r_t * Math.sin(theta_t)
    });
  }
  if (r_tangent < r_involute_start) {
    points.push({
      x: r_involute_start * Math.cos(theta_root_right),
      y: r_involute_start * Math.sin(theta_root_right)
    });
  }
  points.push({
    x: r_tangent * Math.cos(theta_root_right),
    y: r_tangent * Math.sin(theta_root_right)
  });
  
  // 6. 右齿根圆角
  if (R_f > 0) {
    const cx = (r_f + R_f) * Math.cos(phi_c_right);
    const cy = (r_f + R_f) * Math.sin(phi_c_right);
    const p_tan = { x: r_tangent * Math.cos(theta_root_right), y: r_tangent * Math.sin(theta_root_right) };
    const p_root = { x: r_f * Math.cos(phi_c_right), y: r_f * Math.sin(phi_c_right) };
    
    const b_start = Math.atan2(p_tan.y - cy, p_tan.x - cx);
    let b_end = Math.atan2(p_root.y - cy, p_root.x - cx);
    if (b_end - b_start > Math.PI) b_end -= 2 * Math.PI;
    if (b_start - b_end > Math.PI) b_end += 2 * Math.PI;
    
    for (let i = 1; i <= N_fillet; i++) {
      const u = i / N_fillet;
      const beta = (1 - u) * b_start + u * b_end;
      points.push({
        x: cx + R_f * Math.cos(beta),
        y: cy + R_f * Math.sin(beta)
      });
    }
  } else {
    points.push({
      x: r_f * Math.cos(theta_root_right),
      y: r_f * Math.sin(theta_root_right)
    });
  }
  
  // 7. 右侧一半槽底圆弧
  const right_slot_angle = -pitchAngle / 2;
  for (let i = 1; i <= N_root / 2; i++) {
    const u = i / (N_root / 2);
    const angle = phi_c_right * (1 - u) + right_slot_angle * u;
    points.push({
      x: r_f * Math.cos(angle),
      y: r_f * Math.sin(angle)
    });
  }
  
  // 计算一些重要的交点，用来在图表上画标注
  // 1. 分度圆与渐开线的交点：极角为 齿厚半角 deltaTheta
  const pitchIntersectionLeft = {
    x: r * Math.cos(deltaTheta),
    y: r * Math.sin(deltaTheta)
  };
  const pitchIntersectionRight = {
    x: r * Math.cos(-deltaTheta),
    y: r * Math.sin(-deltaTheta)
  };
  
  // 2. 基圆与渐开线起点的交点
  const baseThetaLeft = deltaTheta + invAlpha;
  const baseIntersectionLeft = {
    x: r_b * Math.cos(baseThetaLeft),
    y: r_b * Math.sin(baseThetaLeft)
  };
  const baseIntersectionRight = {
    x: r_b * Math.cos(-baseThetaLeft),
    y: r_b * Math.sin(-baseThetaLeft)
  };
  
  return {
    points,
    pitchIntersectionLeft,
    pitchIntersectionRight,
    baseIntersectionLeft,
    baseIntersectionRight
  };
}
