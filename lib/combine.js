var fs = require('fs');
var path = require('path');
var url = require('url');
var http = require('http');
var async = require('async');
var Packer = require('./packer.js').Packer;
var Canvas = require('canvas');
var logger = require('colorful').logging;
var _ = require('underscore');
var Rule = require('./pom/rule');
var errors = require('./errors');

function Combine(imageBucket, config, stylesheet, next) {
    'use strict';
    if (!(this instanceof Combine)) {
        return new Combine(imageBucket, config, stylesheet, next);
    }
    this.stylesheet = stylesheet;
    this.imageBucket = imageBucket;
    this.options = {};
    this.options = _.extend(this.options, config);
    this.stylesheet = stylesheet;
    this.next = next;
    // 是否支持retina显示。
    this.isRetinaSupport = !!this.imageBucket.options.retina;
    this._init();
}
Combine.prototype = {
    _init: function () {
        'use strict';
        var Server = this.getServer(), self = this;
        this.getPackers(function (err, packers) {
            if (err) {
                return self.next(err);
            }
            self.packers = packers;


            var index = 0;
            async.forEach(self.packers, function (packer, callback) {
                index += 1;
                packer.index = index;
                /**
                 * 如果没有背景图片,则不进行图片的拼接
                 */
                if (packer.blocks.length === 0) {
                    return callback();
                }

                packer.server = new Server(self.options.spriteName + '-' + index, self.options.server);
                packer.token = packer.server.token + index + self.options.spriteName;

                if (self.isRetinaSupport) {
                    packer.retina = {};
                    packer.retina.server = new Server(self.options.spriteName + '-retina-' + index, self.options.server);
                    packer.retina.token = 'retina-' + packer.retina.server.token + index + self.options.spriteName;
                }
                self.drawImage(packer, index);

                packer.server.write(packer.canvas, function (err) {
                    if (self.isRetinaSupport) {
                        var Server = self.getServer();
                        packer.retina.server.write(packer.retina.canvas, function (err) {
                            callback();
                        });
                    }
                    else {
                        return callback();
                    }
                });
            }, function () {
                self.next(null, self.packers, self.stylesheet);
            });
        });
    },
    getServer: function () {
        'use strict';
        var Server, self = this;
        try {
            Server = require('./plugin/' + self.options.server.name);
        }
        catch (e) {
            logger.error('无法加载：%s,使用默认配置', self.options.server.name);
            logger.error('error:%s', e);
            Server = require('./plugin/local');
        }
        return Server;
    },
    getPackers: function (next) {
        'use strict';
        var self = this, blocks = [], //blocks 存储px的图片
        //vBlocks，存储left和right的图片，合并在最后
            vBlocks = [], i, packer,
            blockBuckets = [
                {
                    images: [],
                    blocks: []
                }
            ];
        var images = [];
        for (i in this.imageBucket.images) {
            if (this.imageBucket.images.hasOwnProperty(i)) {
                images.push(this.imageBucket.images[i]);
            }
        }
        async.forEach(images, function (image, callback) {
            var file_path = image.file;
            // 目前只考虑一个bucket的情况。
            var bucket = blockBuckets[0];
            var canvasImage = new Canvas.Image();
            canvasImage.onerror = function (e) {
                if (e.message === 'out of memory') {
                    var msg =
                        'canvas 画图出现故障 \n \
请尝试使用以下方式解决：\n \
1. 重新处理图片：' + image.url + '\n ' + '\
2. 如果使用alipay，请使用原始图片而非压缩后的图片：\n \
   在图片名称后，添加“_src”。比如：https://i.alipay.com/e/201304/BUpbE2yzV_src.png \n \
3. 使用云端模式：peaches --cloud=http://cloud.peaches.io/api ';
                    var err = new errors.CanNotDrawImage(msg);
                    return next(err);
                }
                else if (e.message === 'error while reading from input stream') {
                    return next(new errors.CanNotDownloadFile('无法下载: ' + image.url));
                }
                return next(e);
            };

            canvasImage.onload = function () {
                // 当网页放大和缩小时，有时会出现多余的图像。默认设置图片的间隙增加1px。
                // 经过证实是无效的。为retina，先移除。
                var block = {
                    //w: canvasImage.width + 1,
                    //h: canvasImage.height + 1,
                    w: canvasImage.width,
                    h: canvasImage.height,
                    path: file_path,
                    canvasImage: canvasImage,
                    image: image
                };

                // 如果是 left right的情况(并且position-y为px);
                var pxMatch = image.positions[0].match(/left|right/i);
                if (pxMatch) {
                    var pyMatch = image.positions[0].match(/%|in|cm|mm|em|ex|pt|pc|center|top|bottom/i);
                    if (pyMatch) {
                        return callback();
                    }
                    vBlocks.push(block);
                }
                else {
                    bucket.blocks.push(block);
                }

                return callback();
            };
            fs.readFile(file_path, function (err, buffer) {
                if (err) {
                    logger.error('无法加载文件：', file_path);
                    logger.error('url：', image.url);
                    logger.error('是配置成本地路径吗？请注意正确配置`source`属性');
                    return next(new errors.CanNotDownloadFile('无法下载：' + image.url));
                }
                canvasImage.src = buffer;
            });


        }, function () {
            var packers = [];
            blockBuckets.forEach(function (bucket) {
                blocks = bucket.blocks;
                if (self.options.sort === 'v') {
                    blocks.sort(function (a, b) {
                        return b.w - a.w;
                    });
                }
                else {
                    blocks.sort(function (a, b) {
                        return b.h - a.h;
                    });
                }

                packer = new Packer();
                packer.fit(blocks);
                packer.blocks = blocks;
                packer.vBlocks = [];
                packer.bucket = bucket;
                packers.push(packer);
            });
            //vBlocks 更新到最后一个图片中。
            vBlocks.sort(function (a, b) {
                return b.w - a.w;
            });
            packers[packers.length - 1 ].vBlocks = vBlocks;
            next(null, packers);
        });
    },
    updatePosition: function (packer, block, x, y, index) {
        'use strict';
        var url = block.image.url, self = this,
            backgroundImage , positions, positionsX, positionsY;
        this.stylesheet.rules.forEach(function (rule, idx) {
            // 如果是CSS3 函数
            if (!rule.selectors) {
                return;
            }
            if (!rule.isPeaches) {
                return;
            }
            backgroundImage = rule.getDeclarationValue('background-image')[0];
            positions = rule.getDeclarationValue('background-position')[0] || '0 0';

            /**
             *  如果这个rule没有这个样式,不处理
             */
            if (backgroundImage.indexOf(url) < 0) {
                return;
            }

            positions = positions.split(/\s+/);

            /**
             * 如果只有一个postions的情况,那么第二个postion的值为50%;
             * 这种情况不处理.
             * by biyue 目前测试出来的结果第二个值是NaNpx 2012.11.19
             * ??解析出来是有值的 firefox是center;chrome是50%，不存在length==1的情况
             */
            if (positions.length === 1) {
                logger.warn('position值只有1个时不做合并处理');
                return;
            }
            switch (positions[0].toLowerCase()) { //避免属性出现大写的情况['LEFT CENTER','Left 0'] 2012.11.19 by biyue
                case 'left':
                    positionsX = 'left ';
                    break;
                case 'right':
                    positionsX = 'right ';
                    break;
                case 'center':
                    positionsX = 'center '; //水平center的需要支持 2012.11.19 by biyue
                    break;
                default :
                    positionsX = parseInt(positions[0], 10) - x;
                    if (self.isRetinaSupport) {
                        positionsX = positionsX / 2;
                    }
                    //当值为0时不添加px 2012.11.19 by biyue
                    positionsX += (positionsX === 0 ) ? ' ' : 'px ';
            }
            positionsY = parseInt(positions[1], 10) - y;
            if (self.isRetinaSupport) {
                positionsY = positionsY / 2;
            }
            //当值为0时不添加px 2012.11.19 by biyue
            positionsY += (positionsY === 0 ) ? '' : 'px';

            rule.setDeclarationValue('background-image', 'url(' + packer.token + ')');
            rule.setDeclarationValue('background-position', positionsX + positionsY);

            /**
             * 自动更新width:auto heigth:auto的元素
             */
            var width = rule.getDeclarationValue('width');
            if (width.length === 1) {
                width = width[0];
                if (width === 'auto') {
                    rule.setDeclarationValue('width', (self.isRetinaSupport ? block.canvasImage.width / 2 : block.canvasImage.width) + 'px');
                }
            }
            var height = rule.getDeclarationValue('height');
            if (height.length === 1) {
                height = height[0];
                if (height === 'auto') {
                    rule.setDeclarationValue('height', (self.isRetinaSupport ? block.canvasImage.height / 2 : block.canvasImage.height) + 'px');
                }
            }
            // 高清屏支持
            if (self.isRetinaSupport) {
                packer.retina.sheet.rules.push(new Rule({
                    selectors: rule.selectors,
                    declarations: [
                        {
                            property: 'background-image',
                            value: 'url(' + packer.retina.token + ')'
                        },
                        {
                            property: 'background-size',
                            value: (packer.retina.canvas.width / 2) + 'px ' + (packer.retina.canvas.height / 2) + 'px'
                        }
                    ]
                }));
            }
        });
    },
    drawImage: function (packer, index) {
        'use strict';
        var width = packer.root.w,
            height = packer.root.h,
            n, block, x, y,
            canvas, ctx, retinaCtx;
        /** 计算画布的宽高 开始...**/
        /**
         * 先得到混合排列容器需要的宽度\高度
         * 将垂直排列的图片的宽高,加入到容器宽高中.
         */
        for (n = 0; n < packer.vBlocks.length; n++) {
            block = packer.vBlocks[n];
            if (width < block.w) {
                width = block.w;
            }
            height += block.h;
        }
        /** 计算画布的宽高 结束...**/
        if (this.isRetinaSupport) {
            canvas = new Canvas(width / 2, height / 2);
            packer.canvas = canvas;
            packer.retina.canvas = new Canvas(width, height),
                packer.retina.sheet = {
                    media: 'only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)',
                    rules: []
                };
            ctx = canvas.getContext('2d');
            retinaCtx = packer.retina.canvas.getContext('2d');
        } else {
            canvas = new Canvas(width, height);
            packer.canvas = canvas;
            ctx = canvas.getContext('2d');
        }
        /** 紧凑排序图片 开始... **/
        for (n = 0; n < packer.blocks.length; n++) {
            block = packer.blocks[n];
            if (block.fit) {
                x = block.fit.x;
                y = block.fit.y;
            }
            else {
                x = 0;
                y = 0;
            }
            try {
                if (this.isRetinaSupport) {
                    if (x % 2 === 1 || y % 2 === 1) {
                        logger.start(block.image.url);
                        logger.warn('§ 警告：为了最大的兼容性，Retina模式下，请避免出现奇数宽高！§');
                        logger.end("宽度：%s ，高度：%s", x, y);
                    }
                    ctx.drawImage(block.canvasImage, x / 2, y / 2, block.canvasImage.width / 2, block.canvasImage.height / 2);
                    retinaCtx.drawImage(block.canvasImage, x, y);
                }
                else {
                    ctx.drawImage(block.canvasImage, x, y);
                }

            }
            catch (e) {
                logger.info(block.image);
                logger.error('加载canvas出错，请重新安装canvas');
            }
            this.updatePosition(packer, block, x, y, index);
        }
        /** 紧凑排序图片 结束... **/

        /** 垂直图片排序 开始... **/
        x = 0;
        y = packer.root.h;
        for (n = 0; n < packer.vBlocks.length; n++) {
            block = packer.vBlocks[n];
            //根据position 设置是否紧贴图片边缘.
            switch (block.image.positions[0]) {
                case 'right':
                    x = canvas.width - block.canvasImage.width;
                    break;
                case 'left':
                    x = 0;
                    break;
                default :
                    x = 0;
                    break;
            }
            ctx.drawImage(block.canvasImage, x, y);
            this.updatePosition(packer, block, block.image.positions[0], y, index);
            y += block.h;
        }
        /** 垂直图片排序 结束... **/

    }
};
module.exports = Combine;
