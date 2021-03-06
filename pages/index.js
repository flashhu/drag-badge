// pages/index.js
const defaultMsg = () => {
  let res = [];
  for(let i = 1;i < 3;i ++) {
    res.push({
      content: `这是第${i}条测试消息`,
      count: 1});
  }
  return res;
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    msg: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const msg = defaultMsg();
    this.setData({ msg: msg});
  },

  handleDisappear: function (event) {
    const id = event.target.id;
    let msg = this.data.msg;
    msg[id].count --;
    this.setData({msg: msg})
    console.log(event, `read!`)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})