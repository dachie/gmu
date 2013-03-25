/**
 * @file Slider － 内容可动态修改插件
 * @name Button － 内容可动态修改插件
 * @short Button.dynamic
 * @desc 此插件扩充slider， 让内容可以动态修改，
 *
 *
 * @import widget/slider.js
 */
(function ($) {
    var itemRender = function (item) {
        return '<div class="ui-slider-item">' +
            '<a href="' + item.href + '"><img lazyload="' + item.pic + '"/></a>' +
            (item.title ? '<p>' + item.title + '</p>' : '') + '</div>';
    }

    $.ui.slider.register(function () {
        return {
            pluginName: 'dynamic',

            _setup: function () {
                throw new Error("This plugin does not support setup mode");
            },

            _create: function () {
                var data = this._data, group,
                    content = data.content;

                data.autoPlay = false;//disable auto play
                data.loop = false;//disable loop
                data.viewNum = 1; //disable multi items per page.

                group = $('<div class="ui-slider-group"></div>');
                this._renderItems(content, data.index || 0, group, data);

                (this.root() || this.root($('<div></div>')))
                    .addClass('ui-slider')
                    .appendTo(data.container || (this.root().parent().length ? '' : document.body))
                    .html(
                        $('<div class="ui-slider-wheel"></div>')
                            .append(group)
                    );
                this._addDots();
            },

            _renderItems: function (content, index, group, data) {
                var arr, active, rest, item, i,
                    render = data.itemRender || itemRender;//allow customize render

                arr = content.slice(index, index + 3);
                this._active = active = content[index];
                rest = 3 - arr.length;
                rest && (arr = content.slice(index - rest, index).concat(arr));

                data.index = $.inArray(active, this._pool = arr);
                this._index = index;

                for (i = 0; i < 3 && (item = arr[i]); i++)
                    group.append(render(item));

                this._loadImages(group.find('img[lazyload]'));
            },

            _init: function () {
                this._initOrg();
                this._adjustPos()
                    ._updateNav();
                this.trigger('slide', [this._index || 0, this._active]);
            },

            _updateNav: function (duration, forgetDot) {
                var data = this._data;
                if (data.showDot && !forgetDot) {
                    this.root()
                        .find('p.ui-slider-dots b')
                        .removeClass('ui-slider-dot-select')
                        .eq(this._index)
                        .addClass('ui-slider-dot-select');
                }
                data.wheel.style.cssText += '-webkit-transition:' + (duration || '0') + 'ms;-webkit-transform:translate3d(-' + data.index * data.width + 'px,0,0);';
                return this;
            },

            _transitionEnd: function () {
                this._transitionEndOrg();
                this._adjustPos();
            },

            _adjustPos: function () {
                var data = this._data,
                    root = this.root(),
                    content = data.content,
                    length = content.length,
                    item, elem, width = data.width,
                    group = root.find('.ui-slider-group'),
                    render = data.itemRender || itemRender,
                    index, pos, delta, next;

                index = $.inArray(this._active, content);
                pos = data.index;
                delta = pos - 1;
                next = index + delta;

                if (delta && next < length && next >= 0) {
                    //need to move
                    item = content[next];
                    elem = $(render(item));
                    this._loadImages(elem.find('img[lazyload]'));

                    group.children().eq(1 - delta)
                        .remove();
                    group[delta < 0 ? 'prepend' : 'append'](elem);

                    this._pool.splice(1 - delta, 1);
                    this._pool[delta < 0 ? 'unshift' : 'push'](item);

                    data.index -= delta;
                    data.items = group.children().each(function (i) {
                        this.style.cssText += 'width:' + width + 'px;position:absolute;-webkit-transform:translate3d(' + i * width + 'px,0,0);z-index:' + (900 - i);
                    });
                    this._updateNav(0, true);
                }
                if (index === 0 || index === length - 1) {
                    //到达边缘
                    this.trigger('edge', [index === 0, this._active]);
                }
                return this;
            },

            _addDots: function () {
                var me = this,
                    root = me.root(),
                    length = me.data('content').length,
                    html = [];
                if (me.data('showDot')) {
                    root.find('p.ui-slider-dots').remove();
                    html.push('<p class="ui-slider-dots">');
                    while (length--) html.push('<b></b>');
                    html.push('</p>');
                }
                me.data('showArr') && !root.find('.ui-slider-pre').length &&
                html.push('<span class="ui-slider-pre"><b></b></span><span class="ui-slider-next"><b></b></span>');

                root.append(html.join(''));
                return this;
            },

            /**
             * 轮播位置判断
             */
            _move: function (index) {
                var data = this._data,
                    _index;

                data.index = index;
                this._active = this._pool[index];
                this._index = _index = $.inArray(this._active, data.content);

                this.trigger('slide', [_index, this._active]);
                this._updateNav(data.animationTime);
            },

            _touchStart: function (e) {
                var data = this._data,
                    target, current, matrix;

                this._touchStartOrg.apply(this, arguments);
                target = -data.index * data.width;
                matrix = getComputedStyle(data.wheel, null)['webkitTransform'].replace(/[^0-9\-.,]/g, '').split(',');
                current = +matrix[4];
                if (target !== current) {
                    this._adjustPos();
                }
            },

            _loadImages: function (imgs) {
                var data = this._data;

                data.imgZoom && imgs.on('load', function () {
                    var h = this.height,
                        w = this.width,
                        width = data.width,
                        height = data.height,
                        min_h = Math.min(h, height),
                        min_w = Math.min(w, width);

                    $(this).off('load', arguments.callee);

                    this.style.cssText += h / height > w / width ?
                        ('height:' + min_h + 'px;' + 'width:' + min_h / h * w + 'px;') :
                        ('height:' + min_w / w * h + 'px;' + 'width:' + min_w + 'px');
                });

                imgs.each(function () {
                    this.src = this.getAttribute('lazyload');
                    this.removeAttribute('lazyload');
                });
            },

            update: function (content) {
                var data = this._data, group, width = data.width,
                    active,
                    index = $.inArray(active = this._active, content);

                ~index || (index = data._direction > 0 ? 0 : content.length - 1);
                group = this.root().find('.ui-slider-group').empty();
                this._renderItems(data.content = content, index, group, data);
                data.items = group.children()
                    .each(function (i) {
                        this.style.cssText += 'width:' + width + 'px;position:absolute;-webkit-transform:translate3d(' + i * width + 'px,0,0);z-index:' + (900 - i);
                    });

                this._addDots()
                    ._adjustPos();
                active !== this._active && this.trigger('slide', [index || 0, this._active]);
            }
        };
    });
})(Zepto);