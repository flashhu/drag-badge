import { 
  setCvsSize, 
  drawBadge, 
  drawOutOfRange, 
  drawInRange,
  getRAfterMove,
  isiOS,
  badgeRebound,
  badgeExplode
} from '../../utils/draw.js'

// 最大拖拽距离
const MAX_DRAG_DISTANCE = 60;
// 封顶数字
const MAX_COUNT = 99;
// 固定圆初始值：x, y, r 同一值
const DEF_CIRCLE = 10
// 固定圆初始值（红点模式）：x, y, r 同一值
const DEF_CIRCLE_DOT = 8

Component({
  properties: {
    // 唯一标识符
    name: String,
    // 红点模式，是否显示数字
    dot: {
      type: Boolean,
      value: false
    },
    // 消息数量
    count: {
      type: Number,
      value: 0
    }
  },

  data: {
    // 拖拽状态
    isDrag: false,
    // 拖拽距离是否已过大
    isOutOfRange: false,
    // 固定圆{x, y}
    fixCircle: null,
    // 两圆点圆心距
    distance: 0,
    // 两圆夹角（touch - fix）
    angle: 0,
    // canvas 实例
    cvsInstance: null
  },

  lifetimes: {
    ready: async function() {
      if(this.properties.count) {
        const r = await this.getCvsAndCtx(this.properties.name);
        if (r) {
          this.setData({cvsInstance: r});
          const defCircle = this.properties.dot ? DEF_CIRCLE_DOT : DEF_CIRCLE;
          const value = this.properties.count > MAX_COUNT ? `${MAX_COUNT}+` : this.properties.count;
          drawBadge(r.ctx, this.properties.dot, defCircle, value);
        }
      }
    }
  },

  methods: {
    // 获取canvas实例
    getCvsAndCtx: function(selector) {
      return new Promise((resolve, reject) => {
        // 用.in(this)，this传入的是自定义组件的实例 否则取不到
        const query = wx.createSelectorQuery().in(this);
        query.select(`#${selector}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res.length > 0 && res[0]) {
              const cvs = res[0].node;
              const ctx = cvs.getContext('2d');
              const initialSize = { h: res[0].height, w: res[0].width };
              // 用于计算初始点的位置 防止机型不同导致取数异常
              const initialPos = {left: cvs._left, top: cvs._top};
              const cvsInstance = { ctx, cvs, initialSize, initialPos};
              const dpr = wx.getSystemInfoSync().pixelRatio;
              setCvsSize(cvsInstance, res[0].height, res[0].width);
              if (!isiOS()) {
                // 安卓只设一次 画布大小重新缩放后 调用倍数会叠加 导致红点巨大
                cvsInstance.ctx.scale(dpr, dpr);
              }
              resolve(cvsInstance);
            } else {
              reject(error(`not get canvas ${selector}`));
            }
          })
      })
    },
    // 鼠标拖动，状态/数据保存
    handleMove: function(event) {
      const defCircle = this.properties.dot ? DEF_CIRCLE_DOT : DEF_CIRCLE;
      const touchCircle = {
        x: event.touches[0].pageX,
        y: event.touches[0].pageY
      }
      let fixCircle = this.data.fixCircle;
      if (!this.data.fixCircle) {
        fixCircle = {
          x: this.data.cvsInstance.initialPos.left + defCircle,
          y: this.data.cvsInstance.initialPos.top + defCircle
        };
        this.setData({ fixCircle: fixCircle});
      }
      const distance = Math.sqrt((touchCircle.x - fixCircle.x) ** 2 + (touchCircle.y - fixCircle.y) ** 2);
      // 斜率推得角度
      const rate = (touchCircle.x - fixCircle.x) / (touchCircle.y - fixCircle.y);
      const angle = Math.atan(rate);

      // 已处在拖拽状态
      if (this.data.isDrag) {
        this.handleDraw(distance, defCircle, touchCircle, fixCircle);
      }

      // 首次拖拽 canvas尺寸放大 / 判断状态
      if (!this.data.isDrag && distance > defCircle) {
        const w = wx.getSystemInfoSync().windowWidth;
        const h = wx.getSystemInfoSync().windowHeight;
        setCvsSize(this.data.cvsInstance, h, w);
        this.setData({ isDrag: true });
      }
      if (!this.data.isOutOfRange && distance > MAX_DRAG_DISTANCE) {
        this.setData({ isOutOfRange: true });
      }
      this.setData({ distance: distance, angle: angle})
    },
    // 拖动时绘图
    handleDraw: function (distance, defCircle, touchCircle, fixCircle) {
      const r = getRAfterMove(distance, MAX_DRAG_DISTANCE, defCircle);
      const value = this.properties.count > MAX_COUNT ? `${MAX_COUNT}+` : this.properties.count;
      // 连接带
      if (!this.data.isOutOfRange && distance < MAX_DRAG_DISTANCE) {
        drawInRange(this.data.cvsInstance, fixCircle, touchCircle, r);
      } else {
        this.data.cvsInstance.ctx.clearRect(0, 0, this.data.cvsInstance.cvs.width, this.data.cvsInstance.cvs.height);
      }
      // 移动圆
      drawBadge(this.data.cvsInstance.ctx, this.data.dot, { x: touchCircle.x, y: touchCircle.y, r: r.touchR }, value);
    },
    // 拖拽停止
    handleMoveEnd: function (event) {
      // 真机点击也会触发该事件
      if(!this.data.isDrag) return;

      const distance = this.data.distance;
      const size = this.data.cvsInstance.initialSize;
      const ctx = this.data.cvsInstance.ctx;
      const value = this.properties.count > MAX_COUNT ? `${MAX_COUNT}+` : this.properties.count;
      const defCircle = this.properties.dot ? DEF_CIRCLE_DOT : DEF_CIRCLE;
      const touchCircle = {
        x: event.changedTouches[0].pageX,
        y: event.changedTouches[0].pageY
      }
      ctx.clearRect(0, 0, this.data.cvsInstance.cvs.width, this.data.cvsInstance.cvs.height);
      
      if (distance >= MAX_DRAG_DISTANCE && this.data.isOutOfRange) {
        // 已读 => 爆炸
        badgeExplode(this.data.cvsInstance, touchCircle);
        // 恢复初始化值 缩放画布 
        setTimeout(() => {
          this.initAfterMove(size, distance, defCircle, value);
        }, 200);
      } else if (distance < MAX_DRAG_DISTANCE && !this.data.isOutOfRange){
        // 未读 => 回弹
        badgeRebound(this.data.cvsInstance, this.data.angle, this.properties.dot, touchCircle, this.data.fixCircle, defCircle, distance, value);
        // 恢复初始化值 缩放画布 
        setTimeout(() => {
          this.initAfterMove(size, distance, defCircle, value);
        }, 30);
      } else {
        this.initAfterMove(size, distance, defCircle, value);
      }
    },
    initAfterMove: function (size, distance, defCircle, value) {
      setCvsSize(this.data.cvsInstance, size.h, size.w);
      this.setData({
        isDrag: false,
        isOutOfRange: false,
        fixCircle: null,
        distance: 0,
        angle: 0
      }, () => {
        if (distance < MAX_DRAG_DISTANCE) {
          // 防止 css 修改未生效 导致红点显示但宽高比例有误
          setTimeout(() => {
            if (!this.data.isDrag) {
              drawBadge(this.data.cvsInstance.ctx, this.properties.dot, defCircle, value);
            }
          }, 20);
        } else {
          this.triggerEvent('disappear', {})
        }
      });
    }
  }
})
