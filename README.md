## 小程序版仿QQ小红点

### 效果图

![预览](https://img-blog.csdnimg.cn/20201029130335656.gif) 

### 使用方式

1. 复制 [drag-badge](https://github.com/flashhu/drag-badge/tree/master/components) 文件夹到 对应文件夹内，如 components 文件夹
2. 复制 [draw](https://github.com/flashhu/drag-badge/blob/master/utils/draw.js) 文件到 对应文件夹内，如 util 文件夹内
3. 在页面中引入，参考[此处](https://github.com/flashhu/drag-badge/blob/master/pages/index.json)

4. 在页面中使用，如示例：

   ```html
   <badge
         name="cvs{{index}}"
         count="{{item.count}}"
         binddisappear="handleDisappear"
       />
   ```

### API

| 属性  | 说明                                      | 类型    | 默认值 |
| ----- | ----------------------------------------- | ------- | ------ |
| name  | 用于设 Canvas 的 id，注意同一页面不可重复 | String  | —      |
| dot   | 是否设置为红点模式（不显示数字）          | Boolean | false  |
| count | 展示的数字，默认大于99后，显示 99+        | Number  | 0      |

### 事件

| 事件名称      | 说明                       | 返回值 |
| ------------- | -------------------------- | ------ |
| binddisappear | 当小红点清除时触发（已读） | —      |

### 代码逻辑

>  菜鸟写法，请大佬们批评指正！(Ｔ▽Ｔ)

网上的教程以安卓为主，小程序的几乎没有这类的文章，只有极简版

整体逻辑参考安卓的实现

#### 过程分析

1. 点击的位置超出初始圆的范围，进入拖拽状态，画布缩放到全屏大小
2. 在最大拖拽范围内，画初始圆，拖动圆，贝塞尔曲线连接带
3. 超出最大拖拽范围，画拖动圆
4. 结束拖拽，画布缩放到初始大小
   1. 在最大拖拽范围外，已读，气泡爆炸效果，自定义触发事件
   2. 在最大拖拽范围内
      1. 如始终未超出范围，回弹动画，恢复初始状态
      2. 如曾超出范围，恢复初始状态

#### 解决的坑

> 一定要看过真机的效果！！！

1. Canvas 2D 暂时不支持真机调试，需使用**真机预览** 

2. 安卓和 iOS 使用 `ctx.scale` 时的表现不一致，参考社区中的[同类型问题](https://developers.weixin.qq.com/community/develop/doc/000a0897a000c820c2da2f53f56400?_at=1566630830developers.weixin.qq.com)

   最开始时，参照[文档](https://developers.weixin.qq.com/miniprogram/dev/component/canvas.html)中的部分写法，将该部分抽为一处理缩放的函数。在真机测试时发现，安卓机拖动后，缩放比例很大，但 iOS显示如预期。原因大致可推断为安卓的scale在画布大小重设后不会初始化，导致多次叠加。

   **法一：** 改变尺寸时使用`ctx.setTransform(1, 0, 0, 1, 0, 0)`恢复坐标系，用于重新初始化真机的scale

   **法二：** 判断机型，如为安卓，只 scale 一次

3. iOS 取画布值异常

   开始拖拽时，在缩放画布前，通过取画布的`_left`， `_top` ，结合初始圆的半径，推得放大画布后固定圆的坐标。在 iOS 上，发现 `_left`， `_top`  会变成 0。最后选择，在存画布信息时，就计算放大画布后固定圆的坐标，并保存到 data 中

   （嗯~ 我闻到了菜味儿...）

#### 尚存的坑

1.  iOS真机：开始拖动时较大概率会有一巨大变形小红点闪现

   安卓真机：极小概率出现上述情况

   原因推测：拖动状态已更新，使得样式已成功切换，并且已绘制红点；画布已完成清空，宽高变化，scale 缩放设置还未生效，为初始值，故红点巨大且变形。

   ![效果图](https://img-blog.csdnimg.cn/20201029163114198.gif)

2. iOS真机：虽然在上述的坑中，已将固定圆坐标保存，但是仍存在坐标值异常的情况。表现为点击位置离初始圆范围很近，但没有出现贝塞尔连接带。

### 参考链接

[史上最详细仿QQ未读消息拖拽粘性效果的实现](https://www.jianshu.com/p/ed2721286778)



