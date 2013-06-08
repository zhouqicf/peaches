[<img src="https://i.alipayobjects.com/e/201304/67QzDxJ6T.png" class="no-fancybox" alt="Github"/>](https://github.com/sliuqin/peaches)
[<img src="https://travis-ci.org/sliuqin/peaches.png?branch=master" class="no-fancybox" alt="Build Status"/>](https://travis-ci.org/sliuqin/peaches)
> Peaches是一个基于Node的CSS编译工具，用于自动合成CSS Sprite。
> Peaches 追求简单、自然的CSS书写方式！

update: `peaches HD v0.5.0` 发布，支持Retina! ,[变身高富帅：让网站支持高清显示](http://peaches.io/blog/2013/05/20/peaches-for-retina-display/)


原理图：
<img src="https://i.alipayobjects.com/e/201304/66gXH6HTh.png" alt="peaches" style="width: 100%;"/>

1. 我们在书写样式时，对每个需要使用背景图片的元素，进行单独的背景图片定义
2. 运行peaches命令
3. peaches根据样式规则，提取背景图片，并合并为一张sprite图
4. 根据合并后的背景图片重新生成样式，这时将更新背景图片定位

**这样免去了手动合并图片和定位的麻烦，而且也大大提升后续修改样式的效率。**

> 我们希望书写样式时不再浪费时间制作sprite

> 我们希望不再纠结图片放在什么位置最恰当

> 我们希望不再因为设计调整而重新拼图而抓狂

> 我们一直希望有工具能替代这些重复的体力工作，让书写css回归简单、自然

> 所以我们有了Peaches

## 安装篇
不用担心安装会太麻烦，Peaches提供云端模式，基础安装一键完成！

- [Peaches 安装帮助](http://peaches.io/blog/2012/12/12/install) `npm install peaches -g`
- [Canvas 安装帮助](http://peaches.io/blog/2012/12/12/install-canvas)（选装包，决定在项目中使用Peaches后，建议安装）

### 什么是“云端模式”？
由于图片合并需要用到[node-canvas](https://github.com/LearnBoost/node-canvas),这又是一个在Mac和Windows下极其难装的工具。
为了能让更多的人使用Peaches带来的便捷，所以特别提供了服务器端合并图片的方式。当Peaches检测到无法加载canvas时，将自动切换到云端模式。

云端模式和本地模式使用相同的参数和配置。

由于在服务器压缩图片，所以必须要求**图片地址是能够在公网访问到的**。
同时Peaches也提供云端模式安装包，如果团队使用请联系我，并且部署自己的云端服务器，以保证稳定性。

## 使用入门
对着例子，5分钟入门！

- [Peaches入门指南](http://peaches.io/blog/2012/12/12/starter-kit)
- [命令行帮助](http://peaches.io/blog/2012/12/12/command)
- [package.json 配置快速参考](http://peaches.io/blog/2012/12/12/package)


## 谁在使用

* [支付宝首页 Retina](https://www.alipay.com) 
* [支付宝-收银台](https://cashier.alipay.com/)
* [天猫品牌街 Retina](http://brand.tmall.com/)

## 几个例子
- [开拓自己的道路, 使用 Peaches 加速你的网站](http://sliuqin.github.com/peaches-example-firefox/)【[github](http://github.com/sliuqin/peaches-example-firefox)】: 一个对现有网站进行改造的例子
- [支付宝首页Demo](http://sliuqin.github.com/peaches-example-alipay/)【[github](http://github.com/sliuqin/peaches-example-alipay)】: 看看真实的例子
- [支付宝会员保障Demo](http://sliuqin.github.com/peaches-example-safeguard/)【[github](http://github.com/sliuqin/peaches-example-safeguard)】
- [曼德博集合](http://sliuqin.github.io/peaches-example-Mandelbrot/)【[github](http://github.com/sliuqin/peaches-example-Mandelbrot)】

## 大家说
* [使用 Peaches 合并背景图片](http://www.pizn.net/15-01-2013/use-peaches-to-combine-background-image/) 作者: [pizn.net](http://www.pizn.net/) [@展新展新](http://weibo.com/pizner)

## 其他
* [命名由来](http://peaches.io/blog/2012/12/12/origin)

## 联系我
使用过程中有任何问题，可以通过旺旺：@蔡伦 及 [github issues](https://github.com/sliuqin/peaches/issues) 和我联系

