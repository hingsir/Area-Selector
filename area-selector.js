(function ($) {

    var data;
    $.ajax({
        url: '/libs/plugins/Area-Selector-plugin-1.0/district.xml',
        //url: 'district.xml',
        async: false,
        success: function (resp) {
            data = resp;
        }
    })
    /**
     *  options可以为回调函数function或者对象｛defaultArea:'areaCode',selectCompleted:function,onClosed:function｝
     * @param options
     * @returns {$.fn}
     */
    $.fn.areaSelector = function (options) {
        new AreaSelector(this, options)
        return this;
    }

    var AreaSelector = function (jQueryRoot, options) {
        this.jQueryRoot = jQueryRoot
        this.options = options
        if ($.isFunction(options)) {
            this.callback = options
        } else {
            if (options.selectCompleted)
                this.callback = options.selectCompleted
            if (options.defaultArea)
                this.defaultArea = options.defaultArea
        }
        this.init()
    }

    AreaSelector.prototype = {

        init: function () {
            var self = this;
            var html = '<div class="area-main">' +
                '<a class="area-close-btn">×</a>' +
                '<div class="area-header"><ul class="area-titles clearfix"></ul></div>' +
                '<div class="area-body"><ul class="area-list clearfix"></ul></div>' +
                '</div>'

            var jQueryRoot = this.jQueryRoot
            jQueryRoot.html(html)
            jQueryRoot.css({
                display: 'inline-block'
            })

            jQueryRoot.find('.area-close-btn').on('click', function () {
                jQueryRoot.hide()
                if (self.options.onClosed && $.isFunction(self.options.onClosed)) {
                    self.options.onClosed()
                }
            })

            self.addAreaTitle()

            var defaultArea = self.defaultArea
            if (defaultArea) { //有指定默认区域
                var areaType = self.getAreaType(defaultArea)
                var prov, city, county
                if (areaType === 'prov') {
                    prov = $('prov[id=' + defaultArea + ']', data)
                    self.addAreaTitle({
                        code: defaultArea,
                        name: prov.attr('text')
                    })
                    self.loadAreaList(prov.children())
                } else if (areaType === 'city') {
                    prov = $('prov[id=' + defaultArea.substr(0, 2) + '0000' + ']', data)
                    city = $('city[id=' + defaultArea + ']', prov)
                    self.addAreaTitle({
                        code: prov.attr('id'),
                        name: prov.attr('text')
                    })
                    self.addAreaTitle({
                        code: city.attr('id'),
                        name: city.attr('text')
                    })
                    self.loadAreaList(city.children())
                } else if (areaType === 'county') {
                    prov = $('prov[id=' + defaultArea.substr(0, 2) + '0000' + ']', data)
                    city = $('city[id=' + defaultArea.substr(0, 4) + '00' + ']', prov)
                    county = $('county[id=' + defaultArea + ']', city)
                    self.addAreaTitle({
                        code: prov.attr('id'),
                        name: prov.attr('text')
                    })
                    self.addAreaTitle({
                        code: city.attr('id'),
                        name: city.attr('text')
                    })
                    self.loadAreaList(city.children(), defaultArea)
                }
            } else {
                self.loadAreaList($('prov', data))
            }

        },
        loadAreaList: function (areas, defaultArea) {
            var self = this;
            var areaList = self.jQueryRoot.find('.area-list')
            areaList.empty()
            $.each(areas, function () {
                var $this = $(this)
                var item = $('<li class="area-item">' + $this.attr('text') + '</li>')
                item.attr('data-code', $this.attr('id'))
                item.attr('data-name', $this.attr('text'))
                item.on('click', function () {
                    self.areaSelected($(this))
                }).on('mouseover', function () {
                    $(this).siblings().removeClass('area-item-selected')
                    $(this).addClass('area-item-selected')
                }).on('mouseout', function () {
                    $(this).removeClass('area-item-selected')
                })
                if (defaultArea && $this.attr('id') === defaultArea) {
                    item.addClass('area-item-selected')
                }
                areaList.append(item)
            })
        },
        addAreaTitle: function (areaTitle) {
            var self = this;
            var areaTitles = self.jQueryRoot.find('.area-titles')
            var title
            if (!areaTitle) {
                title = $('<li class="area-title">请选择<s></s></li>')
                    .addClass('area-title-selected')
                areaTitles.append(title)
            } else {
                title = $('<li class="area-title"></li>')
                    .html(areaTitle.name + '<s></s>')
                    .attr('data-code', areaTitle.code)
                    .attr('data-name', areaTitle.name)
                    .on('click', function () {
                        self.titleClicked($(this))
                    })
                title.insertBefore(areaTitles.find('.area-title').last())
            }
        },
        titleClicked: function (target) {
            var self = this
            var prev = target.prev('.area-title')
            if (prev.length === 0) {
                target.siblings(':not(.area-title-selected)').remove()
                self.loadAreaList($('prov', data))
            } else {
                var prevAreaCode = prev.attr('data-code'),
                    prevAreaType = self.getAreaType(prevAreaCode),
                    prevSubAreas = $(prevAreaType + '[id=' + prevAreaCode + ']', data).children()
                self.loadAreaList(prevSubAreas)
            }
            target.remove()
        },
        areaSelected: function (target) {
            var self = this;
            var areaCode = target.attr('data-code'),
                areaType = self.getAreaType(areaCode)
            self.addAreaTitle({
                code: target.attr('data-code'),
                name: target.attr('data-name')
            })
            var subAreas = $(areaType + '[id=' + areaCode + ']', data).children()
            if (subAreas.length === 0) {//叶子区域
                self.callback && $.isFunction(self.callback) && self.callback(self.getAreaTitles())
            } else {
                self.loadAreaList(subAreas)
            }
        },
        getAreaType: function (areaCode) {
            var length = areaCode.length
            if (areaCode.substr(length - 4) === "0000") {
                return 'prov'
            } else if (areaCode.substr(length - 2) == "00") {
                return 'city'
            } else {
                return 'county'
            }
        },
        getAreaTitles: function () {
            var self = this
            var areaTitles = self.jQueryRoot.find('.area-header .area-titles .area-title').not('.area-title-selected')
            var titles = []
            areaTitles.each(function () {
                var $this = $(this), name = $this.attr('data-name')
                if (!['市', '县', '市辖区'].contains(name)) {
                    titles.push({
                        code: $this.attr('data-code'),
                        name: name
                    })
                }
            })
            return titles
        }
    }
})(jQuery)