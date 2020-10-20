import { 
  setCvsSize, 
  drawBadge, 
  drawOutOfRange, 
  drawInRange,
  getRAfterMove,
  isiOS
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
              const cvsInstance = { ctx, cvs, initialSize};
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
          x: this.data.cvsInstance.cvs._left + defCircle,
          y: this.data.cvsInstance.cvs._top + defCircle
        };
        this.setData({ fixCircle: fixCircle});
      }
      const distance = Math.sqrt((touchCircle.x - fixCircle.x) ** 2 + (touchCircle.y - fixCircle.y) ** 2);

      // 首次拖拽 canvas尺寸放大 / 判断状态
      if (!this.data.isDrag && distance > defCircle) {
        const w = wx.getSystemInfoSync().windowWidth;
        const h = wx.getSystemInfoSync().windowHeight;
        setCvsSize(this.data.cvsInstance, h, w);
        this.setData({isDrag: true})
      }
      if (!this.data.isOutOfRange && distance > MAX_DRAG_DISTANCE) {
        this.setData({ isOutOfRange: true });
      }
      this.setData({distance: distance})

      // 绘图
      if (distance > defCircle) {
        const r = getRAfterMove(distance, MAX_DRAG_DISTANCE, defCircle);
        const value = this.properties.count > MAX_COUNT ? `${MAX_COUNT}+` : this.properties.count;
        drawOutOfRange(this.data.cvsInstance, this.data.dot, value, touchCircle, r.touchR);
        if (!this.data.isOutOfRange && distance < MAX_DRAG_DISTANCE) {
          drawInRange(this.data.cvsInstance.ctx, fixCircle, touchCircle, r);
        }
      }
    },
    // 拖拽停止
    handleMoveEnd: function (event) {
      // 真机点击也会触发该事件
      if(!this.data.isDrag) return;
      const distance = this.data.distance;
      const size = this.data.cvsInstance.initialSize;
      setCvsSize(this.data.cvsInstance, size.h, size.w);
      this.setData({
        isDrag: false,
        isOutOfRange: false,
        fixCircle: null,
        distance: 0
      }, ()=>{
        if (distance < MAX_DRAG_DISTANCE) {
          const defCircle = this.properties.dot ? DEF_CIRCLE_DOT : DEF_CIRCLE;
          const value = this.properties.count > MAX_COUNT ? `${MAX_COUNT}+` : this.properties.count;
          // 防止 css 修改未生效 导致红点显示但宽高比例有误
          setTimeout(()=>{
            drawBadge(this.data.cvsInstance.ctx, this.properties.dot, defCircle, value);
          }, 20);
        } else {
          this.triggerEvent('disappear', {})
        }
      });
    }
  }
})
