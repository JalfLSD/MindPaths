; (function ($, window, undefined) {

    'use strict';

    // global
    var Modernizr = window.Modernizr;

    jQuery.fn.reverse = [].reverse;

    $.SwatchWords = function (options, element) {
        this.$el = $(element);
        this._init(options);
    };

    $.SwatchWords.defaults = {
        // index of centered item
        center: 2,
        // number of degrees that is between each item
        angleInc: -12,
        speed: 700,
        easing: 'ease',
        // amount in degrees for the opened item's next sibling
        proximity: -22,
        // amount in degrees between the opened item's next siblings
        neighbor: -12,
        // animate on load
        onLoadAnim: true,
    };

    $.SwatchWords.prototype = {

        _init: function (options) {
            this.options = $.extend(true, {}, $.SwatchWords.defaults, options);

            this.$items = this.$el.children('div');
            this.itemsCount = this.$items.length;
            this.current = -1;
            this.support = Modernizr.csstransitions;
            this.cache = [];

            if (this.options.onLoadAnim) {
                this._setTransition();            
            }
            this._center(this.itemsCount / (this.options.center), this.options.onLoadAnim);
        },
        
        _setTransition: function () {
            if (this.support) {
                this.$items.css({ 'transition': 'all ' + this.options.speed + 'ms ' + this.options.easing });
                this.$items.css({ '-webkit-transition': 'all ' + this.options.speed + 'ms ' + this.options.easing });
            }

        },

        _center: function (idx, anim) {
            var self = this;
            this.$items.each(function (i) {
                var transformStr = 'rotate(' + (self.options.angleInc * (i - idx)) + 'deg)';
                $(this).css({ 'transform': transformStr });
                $(this).css({ '-webkit-transform': transformStr });
            });

        },

    };

    var logError = function (message) {

        if (window.console) {

            window.console.error(message);

        }

    };

    $.fn.swatchWords = function (options) {

        var instance = $.data(this, 'swatchWords');

        if (typeof options === 'string') {
            var args = Array.prototype.slice.call(arguments, 1);

            this.each(function () {

                if (!instance) {

                    logError("cannot call methods on swatchWords prior to initialization; " +
					"attempted to call method '" + options + "'");
                    return;

                }

                if (!$.isFunction(instance[options]) || options.charAt(0) === "_") {

                    logError("no such method '" + options + "' for swatchWords instance");
                    return;

                }

                instance[options].apply(instance, args);

            });

        }
        else {
            this.each(function () {

                if (instance) {

                    instance._init();

                }
                else {

                    instance = $.data(this, ('swatchWords'), new $.SwatchWords(options, this));

                }

            });

        }
        return instance;

    };

})(jQuery, window);