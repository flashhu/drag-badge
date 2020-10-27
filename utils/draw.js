/**
 * 判断设备是安卓还是iOS
 */
export const isiOS = () => {
  const system = wx.getSystemInfoSync().system;
  if(system.slice(0, 3) === "iOS") {
    return true;
  }else {
    return false;
  }
}

/**
 * 重设画布宽高
 * @param {*} instance {cvs, ctx}
 * @param {*} height 
 * @param {*} width 
 */
export const setCvsSize = (instance, height, width) => {
  instance.ctx.clearRect(0, 0, instance.cvs.width, instance.cvs.height);
  const dpr = wx.getSystemInfoSync().pixelRatio;
  instance.cvs.width = width * dpr;
  instance.cvs.height = height * dpr;
  if (isiOS()) {
    instance.ctx.scale(dpr, dpr);
  }
}

/**
 * 画圆
 * @param {*} ctx 上下文
 * @param {*} x 
 * @param {*} y 
 * @param {*} r 
 * @param {*} color 圆的颜色
 */
const drawCircle = (ctx, x, y, r, color='red', type = 'fill') => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2, true);
  if(type === 'fill') {
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  if(type === 'stroke') {
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}

/**
 * 画圆中文本
 * @param {*} ctx 
 * @param {*} value 文本，直接用于显示
 * @param {*} x 
 * @param {*} y 
 */
const drawText = (ctx, value, x, y) => {
  ctx.textAlign = "center";
  ctx.font = "10px serif";
  ctx.strokeStyle = "#fff";
  ctx.strokeText(value, x, y);
}

/**
 * 画徽标 （带判断要不要画文字）
 * @param {*} ctx 
 * @param {Boolean} dot 红点模式
 * @param {*} defCircle 可只传入一值；或 {x, y, r}
 * @param {*} value 徽标上显示的已处理文本内容
 */
export const drawBadge = (ctx, dot, circle, value) => {
  if (!circle.x) {
    circle = {
      x: circle,
      y: circle,
      r: circle
    }
  }
  drawCircle(ctx, circle.x, circle.y, circle.r);
  if (!dot) {
    drawText(ctx, value, circle.x, circle.y + circle.r * 0.4);
  }
}

/**
 * 绘制回弹 需要10ms
 * @param {*} instance 实例
 * @param {*} angle 两圆心夹角 (touch - fix)
 * @param {*} dot 红点模式
 * @param {*} touchC {x, y}
 * @param {*} fixC {x, y}
 * @param {*} r 
 * @param {*} distance 圆心距
 * @param {*} value 徽标中的文字
 */
export const badgeRebound = (instance, angle, dot, touchC, fixC, r, distance, value) => {
  const ctx = instance.ctx;
  // 原始位置
  ctx.clearRect(0, 0, instance.cvs.width, instance.cvs.height);
  drawBadge(ctx, dot, { x: fixC.x, y: fixC.y, r: r}, value);
  // 回弹位置
  setTimeout(()=>{
    ctx.clearRect(0, 0, instance.cvs.width, instance.cvs.height);
    const boundCircle = {
      x: touchC.x - distance * Math.sin(angle) * 1.3,
      y: touchC.y - distance * Math.cos(angle) * 1.3
    };
    drawBadge(ctx, dot, {x: boundCircle.x, y: boundCircle.y, r}, value);
  }, 10);
}

/**
 * 绘制爆炸效果
 * @param {*} instance 
 * @param {*} touchC {x, y}
 */
export const badgeExplode = (instance, touchC) => {
  const ctx = instance.ctx;
  ctx.clearRect(0, 0, instance.cvs.width, instance.cvs.height);
  drawCircle(ctx, touchC.x, touchC.y, 8, '#e7e7e7', 'stroke');
  drawCircle(ctx, touchC.x - 12, touchC.y - 12, 5, '#e7e7e7', 'stroke');
  drawCircle(ctx, touchC.x + 12, touchC.y + 12, 5, '#e7e7e7', 'stroke');
  drawCircle(ctx, touchC.x + 12, touchC.y - 12, 3, '#e7e7e7', 'stroke');
  drawCircle(ctx, touchC.x - 12, touchC.y + 12, 4, '#e7e7e7', 'stroke');
  setTimeout(()=>{
    ctx.clearRect(0, 0, instance.cvs.width, instance.cvs.height);
    drawCircle(ctx, touchC.x, touchC.y, 3, '#e7e7e7', 'stroke');
    drawCircle(ctx, touchC.x - 12, touchC.y - 12, 7, '#e7e7e7', 'stroke');
    drawCircle(ctx, touchC.x + 10, touchC.y + 12, 6, '#e7e7e7', 'stroke');
    drawCircle(ctx, touchC.x + 12, touchC.y - 12, 6, '#e7e7e7', 'stroke');
    drawCircle(ctx, touchC.x - 12, touchC.y + 10, 5, '#e7e7e7', 'stroke');
  }, 80);
}

/**
 * 计算拖拽时固定/移动圆对应的半径
 * @param {*} distance 圆心距
 * @param {*} maxDragDistance 最大拖拽距离
 * @param {*} initialR 固定圆初始半径
 */
export const getRAfterMove = (distance, maxDragDistance, initialR ) => {
  const percent = distance / maxDragDistance;
  const fixR = (1 - percent * 0.6) * initialR;
  const touchR = distance > maxDragDistance ? 1.2 * initialR : (1 + percent * 0.2) * initialR;

  return {fixR, touchR}
}

/**
 * 画移动圆(包含清除画布)
 * 与拖拽范围无关，必画
 * @param {*} instance {cvs, ctx}
 * @param {Boolean} dot 红点模式
 * @param {*} value 用于画文本
 * @param {*} touchCircle {x, y}
 * @param {*} touchR 
 */
export const drawOutOfRange = (instance, dot, value, touchCircle, touchR) => {
  drawBadge(ctx, dot, { x: touchCircle.x, y: touchCircle.y, r: touchR}, value);
}

/**
 * 画固定圆及与移动圆的连接段
 * 与拖拽范围有关，不一定画
 * @param {*} ctx {cvs, ctx}
 * @param {*} fixCircle {x, y}
 * @param {*} touchCircle {x, y}
 * @param {*} r {fixR, touchR}
 */
export const drawInRange = (instance, fixCircle, touchCircle, r) => {
  const points = calBezierPoint({
    x: fixCircle.x,
    y: fixCircle.y,
    r: r.fixR
  }, {
      x: touchCircle.x,
      y: touchCircle.y,
      r: r.touchR
    })
  const ctx = instance.ctx;

  ctx.clearRect(0, 0, instance.cvs.width, instance.cvs.height);
  drawCircle(ctx, fixCircle.x, fixCircle.y, r.fixR);
  ctx.beginPath();
  ctx.moveTo(points[0].p0.x, points[0].p0.y);
  ctx.quadraticCurveTo(points[0].p1.x, points[0].p1.y, points[0].p2.x, points[0].p2.y);
  ctx.lineTo(points[1].p0.x, points[1].p0.y);
  ctx.quadraticCurveTo(points[1].p1.x, points[1].p1.y, points[1].p2.x, points[1].p2.y);
  ctx.lineTo(points[0].p0.x, points[0].p0.y);
  ctx.closePath();
  ctx.fillStyle = 'red';
  ctx.fill();
}

/**
 * 计算画贝塞尔曲线的控制点信息
 * @param {*} fixC 固定圆信息 {x, y, r}
 * @param {*} touchC 移动圆信息 {x, y, r}
 */
const calBezierPoint = (fixC, touchC) => {
  // 两圆心连线的中点 => 共用控制点
  const p1 = {
    x: (fixC.x + touchC.x) / 2,
    y: (fixC.y + touchC.y) / 2
  }
  // 斜率推得角度
  const rate = (touchC.x - fixC.x) / (touchC.y - fixC.y);
  const angle = Math.atan(rate);
  // 移动圆-起，固定圆-终：固定圆的某切点
  const p10 = {
    x: touchC.x + Math.cos(angle) * touchC.r,
    y: touchC.y - Math.sin(angle) * touchC.r
  }
  const p12 = {
    x: fixC.x + Math.cos(angle) * fixC.r,
    y: fixC.y - Math.sin(angle) * fixC.r
  }
  // 固定圆-起，移动圆-终：移动圆的某切点，与固定圆取的切点不同向
  const p20 = {
    x: fixC.x - Math.cos(angle) * fixC.r,
    y: fixC.y + Math.sin(angle) * fixC.r
  }
  const p22 = {
    x: touchC.x - Math.cos(angle) * touchC.r,
    y: touchC.y + Math.sin(angle) * touchC.r
  }
  return [
    { p0: p10, p1, p2: p12 },
    { p0: p20, p1, p2: p22 }
  ]
}

/**
 * 画贝塞尔曲线连接带
 * @param {*} ctx 上下文
 * @param {*} fixC 固定圆信息 {x, y, r}
 * @param {*} touchC 移动圆信息 {x, y, r}
 */
export const drawBezier = (ctx, fixC, touchC) => {
  const points = calBezierPoint(fixC, touchC);
  ctx.beginPath();
  ctx.moveTo(points[0].p0.x, points[0].p0.y);
  ctx.quadraticCurveTo(points[0].p1.x, points[0].p1.y, points[0].p2.x, points[0].p2.y);
  ctx.lineTo(points[1].p0.x, points[1].p0.y);
  ctx.quadraticCurveTo(points[1].p1.x, points[1].p1.y, points[1].p2.x, points[1].p2.y);
  ctx.lineTo(points[0].p0.x, points[0].p0.y);
  ctx.closePath();
  ctx.fillStyle = 'red';
  ctx.fill();
}