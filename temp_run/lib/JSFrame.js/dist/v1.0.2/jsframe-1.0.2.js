/**
 * JSFrame ver.1.0.2 - A javascript floating window library
 *
 * Copyright 2007- Tom Misawa, riversun.org@gmail.com
 * Copyright 2007- web2driver.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in the
 * Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 *  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
 * IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

var org;
if (typeof org === 'undefined') {
    org = {};
}

if (typeof org.riversun === 'undefined') {
    org.riversun = {};
}

org.riversun.JSFrame =
    (function () {
        //'use strict';

        var DEF = {};

        var CALIGN = {};
        CALIGN.LEFT_TOP = 'LEFT_TOP';
        CALIGN.HCENTER_TOP = 'CENTER_TOP';
        CALIGN.RIGHT_TOP = 'RIGHT_TOP';
        CALIGN.LEFT_VCENTER = 'LEFT_CENTER';
        CALIGN.HCENTER_VCENTER = 'CENTER_CENTER';
        CALIGN.CENTER = CALIGN.HCENTER_VCENTER;
        CALIGN.RIGHT_VCENTER = 'RIGHT_CENTER';
        CALIGN.LEFT_BOTTOM = 'LEFT_BOTTOM';
        CALIGN.HCENTER_BOTTOM = 'CENTER_BOTTOM';
        CALIGN.RIGHT_BOTTOM = 'RIGHT_BOTTOM';


        /**
         * CFrameAppearance class<br>
         * Appearance Model Class for Frame
         *
         */
        function CFrameAppearance() {

            var me = this;

            this.showTitleBar = true;
            this.showCloseButton = true;
            this.titleBarCaption = '';
            this.titleBarCaptionFontSize = '12px';
            this.titleBarCaptionFontWeight = 'bold';
            this.titleBarHeight = '24px';

            this.useIframe = false;
            this.useFrame = true;

            this.setUseIFrame = function (value) {
                me.useIframe = value;
                me.useFrame = !value;
                return me;
            };


            /**
             * The position from the left side of the caption. If this value is null, caption will be centered.
             */
            this.titleBarCaptionLeftMargin = '5px';

            this.titleBarColorDefault = 'lightgray';
            this.titleBarColorFocused = '#d3e1ee';
            this.titleBarCaptionColorDefault = '';
            this.titleBarCaptionColorFocused = '';

            this.titleBarBorderBottomDefault = '1px solid rgba(0,0,0,0.2)';
            this.titleBarBorderBottomFocused = null;

            this.frameBorderRadius = '6px';

            this.frameBorderWidthDefault = '1px';
            this.frameBorderWidthFocused = this.frameBorderWidthDefault;

            this.frameBorderColorDefault = 'rgba(1, 1, 1, 0.2)';
            this.frameBorderColorFocused = this.frameBorderColorDefault;

            this.frameBorderStyle = 'solid';
            this.frameBoxShadow = '5px 5px 10px  rgba(0, 0, 0, 0.3)';
            this.frameBackgroundColor = 'white';

            this._partsBuilder = null;


            this.frameComponents = new Array();

            this.frameHeightAdjust = 1;

            this.getFrameInnerBorderRadius = function (ref, hasFocus) {

                if (!ref) {
                    return;
                }
                if (hasFocus) {
                    return (parseInt(ref.frameBorderRadius) - parseInt(ref.frameBorderWidthFocused)) + 'px';
                } else {
                    return (parseInt(ref.frameBorderRadius) - parseInt(ref.frameBorderWidthDefault)) + 'px';
                }
            };


            this.onInitialize = function () {

                //Add close button if needed
                if (me.showCloseButton) {
                    var partsBuilder = me.getPartsBuilder();

                    const crossMark0 = '\u274c';
                    const crossMark1 = '\u2716';
                    const crossMark2 = '\u274e';


                    var btnAppearance = partsBuilder.buildTextButtonAppearance();

                    btnAppearance.size = 14;
                    btnAppearance.captionShiftYpx = 0;
                    btnAppearance.captionFontRatio = 1.0;
                    btnAppearance.borderRadius = 2;
                    btnAppearance.backgroundColorPressed = 'transparent';
                    btnAppearance.backgroundColorDefault = 'transparent';
                    btnAppearance.caption = crossMark1;

                    btnAppearance.captionColorDefault = 'gray';
                    btnAppearance.captionColorFocused = 'gray';
                    btnAppearance.captionColorHovered = 'silver';
                    btnAppearance.captionColorPressed = 'black';

                    btnAppearance.borderWidth = 0;
                    btnAppearance.borderColorDefault = '#aaaaaa';
                    btnAppearance.borderStyle = 'solid';

                    var closeBtnEle = partsBuilder.buildTextButton(btnAppearance);
                    var eleLeft = -10;
                    var eleTop = -18;
                    var eleAlign = 'RIGHT_TOP';

                    //closeButton is a special name
                    var frameComponent = me.addFrameComponent('closeButton', closeBtnEle, eleLeft, eleTop, eleAlign);
                }
            };

        }


        CFrameAppearance.prototype.getPartsBuilder = function () {
            var me = this;
            if (me._partsBuilder == null) {
                me._partsBuilder = new CDomPartsBuilder();
            }
            return me._partsBuilder;
        };
        CFrameAppearance.prototype.initialize = function () {
            var me = this;
            me.onInitialize();
        };

        /**
         *  Add FrameComponent into frame
         *  FrameComponent is attached to Frame and it moves with Frame.
         *
         * @param id
         * @param myDomElement DOM element.
         * @param x  Relative x coodinate from the snap position specified by alignment
         * @param y  Relative y coodinate from the snap position specified by alignment
         * @param align 'LEFT_TOP' 'CENTER_TOP' 'RIGHT_TOP' 'LEFT_CENTER' 'CENTER_CENTER' 'RIGHT_CENTER' 'LEFT_BOTTOM' 'CENTER_BOTTOM' 'RIGHT_BOTTOM'
         * @returns {CFrameComponent}
         *
         */
        CFrameAppearance.prototype.addFrameComponent = function (id, myDomElement, x, y, align) {

            //(id, frame, htmlElement, x, y, align)
            var frameComponent = new CFrameComponent(id, myDomElement, x, y, align);

            if (myDomElement._onTakeFocus && myDomElement._onReleaseFocus) {
                //if this DOM element has special method for focus
                //set focus callback
                frameComponent.setFocusCallback(myDomElement._onTakeFocus, myDomElement._onReleaseFocus);
            }

            this.frameComponents.push(frameComponent);

            return frameComponent;
        };

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

        /**
         *  End of CFrameAppearance class
         */

        /**
         * Inheritance function
         *
         * @param subClass
         * @param baseClass
         */
        function inherit(subClass, baseClass) {

            function clazz() {
            }

            clazz.prototype = baseClass.prototype;
            subClass.prototype = new clazz();

            subClass.prototype.constructor = subClass;
            subClass.superConstructor = baseClass;
            subClass.superClass = baseClass.prototype;

        }

        /**
         * End of inheritance function
         */

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

        /**
         * DEFINITIONS
         */
        DEF.CBEAN = {};
        DEF.CBEAN.HTML_ELEMENT = 'span';
        DEF.CBEAN.HTML_ELEMENT_ID_PREFIX = 'htmlElement_';
        DEF.CBEAN.TYPE_NAME = 'bean';


//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-


        /**
         * CBeanFrame Class<p>
         * The smallest window. It is responsible for basic processing only.
         *
         * @param beanId id of this small window
         * @param left
         * @param top
         * @param width
         * @param height
         * @param zindex
         * @constructor
         */
        function CBeanFrame(beanId, left, top, width, height, zindex) {

            var me = this;

            //fields
            me.id = beanId;

            me.parentCanvas = null;
            me.htmlElement = null;


            //initialize
            me.htmlElement = document.createElement(DEF.CBEAN.HTML_ELEMENT);
            me.htmlElement.id = DEF.CBEAN.HTML_ELEMENT_ID_PREFIX + beanId;
            me.htmlElement.style.position = 'absolute';
            me.htmlElement.style.left = parseInt(left) + 'px';
            me.htmlElement.style.top = parseInt(top) + 'px';
            me.htmlElement.style.width = parseInt(width) + 'px';
            me.htmlElement.style.height = parseInt(height) + 'px';

            //Zindex may become 'undefined' in some cases.
            if (zindex != null) {
                me.htmlElement.style.zIndex = zindex;
            }
            me.htmlElement.style.borderColor = '#000000';

            //If I set a larger font size, width and height of window will be affected....
            me.htmlElement.style.fontSize = '1px';

            //Refer parents to each other.(sougo-sansho)
            me.htmlElement.parent = me;

            //Note that 'mouseDown' is mapped to 'onmousedown' of htmlElement,
            //so when 'onmouseDown' fires ,the 'this' will indicate 'htmlElement'
            me.htmlElement.onmousedown = me.onmouseDown;

            //Type name of this class
            me.htmlElement.typeName = DEF.CBEAN.TYPE_NAME;

            //Special field indicating usage of this class
            me.htmlElement.usage = 'nothing';

            //Whether it can move outside the frame(waku).
            me.htmlElement.isRangeLimited = false;

            //Movement magnification in the X direction
            //(If it is 0, it can not move in the X direction.)
            me.htmlElement.argX = 1;

            //Movement magnification in Y direction
            // (If it is 0, it can not move in Y direction)
            me.htmlElement.argY = 1;

        }

        /**
         * Set whether the frame can be moved while dragging with the mouse
         * @param enabled
         */
        CBeanFrame.prototype.setMovable = function (enabled) {
            var me = this;

            if (enabled) {
                me.htmlElement.argX = 1;
                me.htmlElement.argY = 1;
            } else {
                me.htmlElement.argX = 0;
                me.htmlElement.argY = 0;
            }
            return me;
        };


        CBeanFrame.prototype.setParentCanvas = function (parentCanvas) {
            var me = this;
            me.parentCanvas = parentCanvas;
            me.htmlElement.parentCanvas = me.parentCanvas;
        };

        CBeanFrame.prototype.onmouseDown = function (e) {

            //This 'this' means a htmlElement
            var refHtmlElement = this;


            //Retrieve CBeanFrame
            var refCBeanFrame = refHtmlElement.parent;

            if (e.button == 0) {
                refHtmlElement.parentCanvas.currentObject = refHtmlElement;

                //Bring the current bean to the top
                refHtmlElement.parentCanvas.pullUp(refCBeanFrame.id);

            }
            else if (e.button == 2) {
                return false;
            }

            refHtmlElement.parentCanvas.offsetX = e.pageX - parseInt(refHtmlElement.parentCanvas.currentObject.style.left);
            refHtmlElement.parentCanvas.offsetY = e.pageY - parseInt(refHtmlElement.parentCanvas.currentObject.style.top);


            return false;
        };
        /**
         * End of CBeanFrame Class <p>
         */

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-


        DEF.CANVAS = {};
        DEF.CANVAS.HTML_ELEMENT = 'div';

        /**
         * CCanvas class
         * A canvas is a place where windows are arranged, where you can drag and move freely.
         *
         * @param parentElement
         * @param canvasId
         * @param left
         * @param top
         * @param width
         * @param height
         * @constructor
         */
        function CCanvas(parentElement, canvasId, left, top, width, height) {

            //Event data to be transmitted
            function EventData() {
                this.x = 0;
                this.y = 0;
                this.screenX = 0;
                this.screenY = 0;
                this.deltaX = 0;
                this.deltaY = 0;
                this.isMoved = false;
                this.targetTypeName = null;
                this.targetUsage = null;
                this.targetObject = null;
            }

            var me = this;

            me.currentObject = null;
            me.onTopObject = null;
            me.offsetX = 0;
            me.offsetY = 0;


            //Object which generated 'mouseDown' event at the very beginning(ichiban-saisho)
            me.mouseDownSource = null;

            me.id = canvasId;
            me.canvasElement = null;
            me.parentElement = parentElement;
            me.beanList = new Array();
            me.eventData = new EventData();


            me.baseZIndex = 0;
            me.setBaseZIndex = function (baseZIndex) {
                me.baseZIndex = baseZIndex;
            };
            me.getBaseZIndex = function () {
                return me.baseZIndex;
            };


            me.canvasElement = document.createElement(DEF.CANVAS.HTML_ELEMENT);

            me.canvasElement.id = me.id;
            me.canvasElement.style.position = 'absolute';
            me.canvasElement.style.left = parseInt(left) + 'px'
            me.canvasElement.style.top = parseInt(top) + 'px'
            me.canvasElement.style.width = parseInt(width) + 'px';
            me.canvasElement.style.height = parseInt(height) + 'px';
            me.canvasElement.style.backgroundColor = 'transparent'
            me.canvasElement.style.borderStyle = 'none';
            me.canvasElement.style.borderWidth = '0px';

            //Add the Canvas's html element into the canvas's parent html element
            me.parentElement.appendChild(me.canvasElement);

        }


        CCanvas.prototype.mouseMove = function (e) {

            var me = this;


            if (me.currentObject) {

                //eventData.isMoved=true;The presence of event data means that it has moved.
                me.eventData.targetTypeName = me.currentObject.typeName;
                me.eventData.targetUsage = me.currentObject.usage;
                me.eventData.targetObject = me.currentObject;

                //Even when obj is not being dragged, mouse coordinates are used here because they are needed.
                var newObjLeftPx = e.pageX - me.offsetX;
                var newObjTopPx = e.pageY - me.offsetY;

                var absoluteMouseX = e.pageX;
                var absoluteMouseY = e.pageY;


                //Take the snapshot before updating the location.
                var oldObjLeftPx = me.currentObject.style.left;
                var oldObjTopPx = me.currentObject.style.top;

                //When the mouse cursor goes out of range,
                //the addition in the X direction and Y direction (delta X, delta Y) is set to zero.
                //this.left=Cavas's left side edge, this.top=Canvas's top side edge.
                var tmpLeft = parseInt(newObjLeftPx);
                var tmpTop = parseInt(newObjTopPx);

                var tmpRight = tmpLeft + parseInt(me.currentObject.style.width);
                var tmpBottom = tmpTop + parseInt(me.currentObject.style.height);

                var styleWidth = parseInt(me.canvasElement.style.width);
                var styleHeight = parseInt(me.canvasElement.style.height);

                var deltaX = 0;
                var deltaY = 0;

                if (me.currentObject.isRangeLimited == true &&
                    (tmpLeft <= 0 || tmpRight > styleWidth || tmpTop <= 0 || tmpBottom > styleHeight )
                    ) {
                    deltaX = 0;
                    deltaY = 0;
                }
                else {
                    deltaX = (parseInt(newObjLeftPx) - parseInt(oldObjLeftPx));
                    deltaY = (parseInt(newObjTopPx) - parseInt(oldObjTopPx));
                    me.currentObject.style.left = (parseInt(me.currentObject.style.left) + deltaX * me.currentObject.argX) + 'px';
                    me.currentObject.style.top = (parseInt(me.currentObject.style.top) + deltaY * me.currentObject.argY) + 'px';
                }

                me.eventData.deltaX = deltaX;
                me.eventData.deltaY = deltaY;

                return me.eventData;

            }
            //Returns null if none of the objects are clicked and the only mouse just moves.
            return null;
        };


        CCanvas.prototype.mouseUp = function (e) {
            var me = this;

            me.currentObject = null;
            me.mouseDownSource = null;
        };


        //Bring the object in front
        CCanvas.prototype.pullUp = function (targetBeanId) {

            var me = this;

            var tmpBeanArray = new Array();

            var beanList = me.beanList;

            for (var i in   beanList) {
                tmpBeanArray.push(beanList[i]);
            }

            //Bring the target object in front and set zindex to 1.
            var targetBean = beanList[targetBeanId];

            me.pullUpSort(targetBean, tmpBeanArray, me.baseZIndex);


            //Remember the top object
            me.onTopObject = targetBean;


        };

        //Calculate the front / back information of the window accurately.
        CCanvas.prototype.pullUpSort = function (pullupObject, objectArray, baseIndex) {
            var me = this;

            //Increase the index number of the target object
            pullupObject.htmlElement.style.zIndex = objectArray.length + baseIndex;

            //sort by index
            objectArray.sort(function (b, a) {
                return -parseInt(b.htmlElement.style.zIndex) + parseInt(a.htmlElement.style.zIndex);
            });

            //Redefine number of the index
            for (var i in objectArray) {
                objectArray[i].htmlElement.style.zIndex = (objectArray.length - 1) - i + baseIndex;
            }

        };


        /**
         * remove the bean object
         * @param beanId
         */
        CCanvas.prototype.removeBean = function (beanId) {

            var me = this;

            //Retrieve the target beanFrame
            var beanList = me.beanList;
            var targetBean = beanList[beanId];

            //Remove bean's htmlElement from canvasElement
            me.canvasElement.removeChild(targetBean.htmlElement);

            //Delete the bean object in the associative array.
            delete beanList[beanId];


        };


        /**
         * Add bean into this canvas
         * @param bean
         */
        CCanvas.prototype.addBean = function (bean) {

            var me = this;

            var beanList = me.beanList;

            beanList[bean.id] = bean;

            //In this usage case the 'length' property is invalid ..
            var num = 0;

            for (var j in beanList) {
                num++;
            }

            //Set zIndex so that what you add later will come up.
            bean.htmlElement.style.zIndex = num + me.baseZIndex;

            //On the bean side, specify the parent of the bean to me.
            bean.setParentCanvas(me);


            this.canvasElement.appendChild(bean.htmlElement);
        };
        /**
         * End of canvas class
         */

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-


        DEF.CFRAME = {};
        DEF.CFRAME.CANVAS_ELEMENT_BGCOLOR = 'transparent';
        DEF.CFRAME.TITLE_BAR_CLASS_DEFAULT = 'jsFrame.titlebar';
        DEF.CFRAME.TITLE_BAR_CLASS_FOCUSED = 'jsFrame.titlebar.focused';

        inherit(CFrame, CBeanFrame);


        /**
         * CFrame class
         * <p>
         * This class represents a window whose size can be changed ,
         * can move freely on the screen,
         * can have a title bar,
         *
         * @param windowId
         * @param w_left
         * @param w_top
         * @param w_width
         * @param w_height
         * @param zindex
         * @param w_border_width
         * @param appearance
         * @constructor
         */
        function CFrame(windowId, w_left, w_top, w_width, w_height, zindex, w_border_width, appearance) {

            var me = this;

            //call constructor of superclass
            CFrame.superConstructor.call(this, windowId, w_left, w_top, w_width, w_height, zindex);


            me.anchor = CALIGN.LEFT_TOP;

            me.showTitleBar = appearance.showTitleBar;

            me.canvasNetHeight = null;
            me.canvasNetWidth = null;
            me.frameHeightAdjust = appearance.frameHeightAdjust;

            me.frameComponentMap = {};

            //initialize the field
            me.canvas = null;

            //canvas id
            me.myCanvasId = null;

            //Buttons to be placed on the screen (positioning same as the close button)
            me.floatingButton = null;

            me.titleBarClassNameDefault = DEF.CFRAME.TITLE_BAR_CLASS_DEFAULT;
            me.titleBarClassNameFocused = DEF.CFRAME.TITLE_BAR_CLASS_FOCUSED;


            //height of titlebar
            me.titleBarHeight = appearance.titleBarHeight;

            me.titleBarCaption = appearance.titleBarCaption;
            me.titleBarCaptionLeftMargin = appearance.titleBarCaptionLeftMargin;
            me.titleBarCaptionFontSize = appearance.titleBarCaptionFontSize;
            me.titleBarCaptionFontWeight = appearance.titleBarCaptionFontWeight;
            me.titleBarBorderBottomDefault = appearance.titleBarBorderBottomDefault;
            me.titleBarBorderBottomFocused = appearance.titleBarBorderBottomFocused;
            //Title bar width adjustment value
            me.titleAdjustWidth = 0;

            me.windowId = windowId;

            me.exBorderWidth = 0;


            me.myCanvasId = windowId + '_canvas';


            //img element for icon placed on the left-top
            var appIcon = document.createElement('img');
            //		appIcon.src='img/ico_app_file16.gif';

            //url of icon image
            appIcon.src = '';
            appIcon.style.position = 'absolute';
            appIcon.style.left = '2px';
            appIcon.style.top = '2px';
            appIcon.style.width = '16px';
            appIcon.style.height = '16px';
            appIcon.style.visibility = 'hidden';


            //The title bar must be on the front of the canvas.
            me.titleBar = document.createElement('div');

            me.titleBar.className = '.jsFrame.titlebar';

            if (me.showTitleBar) {

                me.titleBar.id = windowId + '_title';
                me.titleBar.style.position = 'absolute';
                me.titleBar.style.top = '0px';
                me.titleBar.style.left = '0px';
                me.titleBar.style.width = (w_width - me.titleAdjustWidth) + 'px';
                me.titleBar.style.userSelect = 'none';


                if (me.titleBarHeight) {

                    var titleBarAdjust = 0;

                    if (me.titleBarBorderBottomDefault) {
                        titleBarAdjust = -1;
                    }


                    me.titleBar.style.height = (parseInt(me.titleBarHeight) + 0) + 'px';
                }

                me.titleBar.style.backgroundColor = me.titleBarColorDefault;
                me.titleBar.style.zIndex = 0;

                me.titleBar.style.color = me.titleBarCaptionColorDefault;
                me.titleBar.style.fontSize = me.titleBarCaptionFontSize;
                me.titleBar.style.fontWeight = me.titleBarCaptionFontWeight;

                me.titleBar.style.textAlign = 'center';
                me.titleBar.style.lineHeight = me.titleBar.style.height;


                me.titleBar.style.borderBottom = me.titleBarBorderBottomDefault;
                //me.titleBar.style.boxShadow = '0 1px 0 rgba(255,255,255,0.5)';


                //TODO deprecation
//                if (parseInt(appearance.frameBorderRadius) > 0) {
//                    me.titleBar.style.borderTopLeftRadius = appearance.getFrameInnerBorderRadius();
//                    me.titleBar.style.borderTopRightRadius = appearance.getFrameInnerBorderRadius();
//                }


                //Set not to display overflow character string
                me.titleBar.style.overflow = 'hidden';


                var titleBarText = document.createTextNode('');

                //'span' to store text
                var titleBarTextSpan = document.createElement('span');

                titleBarTextSpan.id = me.id + '_titleBarText';
                if (me.titleBarCaptionLeftMargin != null) {
                    titleBarTextSpan.style.position = 'absolute';
                    titleBarTextSpan.style.left = parseInt(me.titleBarCaptionLeftMargin) + 'px';
                } else {
                    titleBarTextSpan.style.position = 'absolute';
                    titleBarTextSpan.style.left = '0px';
                    titleBarTextSpan.style.right = '0px';
                }
                titleBarTextSpan.style.top = '0px';
                titleBarTextSpan.appendChild(titleBarText);
                me.titleBar.appendChild(titleBarTextSpan);

                //Discontinue appicon(20061011)
                //me.titleBar.appendChild(appIcon);
            }


            me.htmlElement.appendChild(me.titleBar);


            //Set Canvas throughout the window

            //parseInt(me.titleBar.style.height);//me.titleBarHeight);
            var canvasMoreHeight = parseInt(me.titleBarHeight) - titleBarAdjust;
            var canvasMoreSpacing = parseInt(me.titleAdjustWidth);

            if (me.showTitleBar) {


            } else {
                canvasMoreHeight = 0;
                canvasMoreSpacing = 0;
                titleBarAdjust = 0;
            }


            me.canvasNetWidth = w_width - canvasMoreSpacing;
            me.canvasNetHeight = w_height - canvasMoreHeight - canvasMoreSpacing - 1 - titleBarAdjust + me.frameHeightAdjust;


            //Change the style of htmlElement of CFrame (CBean).
            me.htmlElement.style.cursor = 'move';


            //Create a canvas
            me.canvas = new CCanvas(me.htmlElement, me.myCanvasId, 0, canvasMoreHeight, w_width - canvasMoreSpacing, w_height - canvasMoreHeight - canvasMoreSpacing);

            me.canvas.canvasElement.style.backgroundColor = DEF.CFRAME.CANVAS_ELEMENT_BGCOLOR;
            me.canvas.canvasElement.style.cursor = 'default';

            //Handling the omousedown event that occurred in Canvas which is a child element of CFrame
            me.canvas.canvasElement.onmousedown = me.canvasMouseDown;

            //Set the canvas as a reference to the parent of the canvas html element canvasElement.
            me.canvas.canvasElement.parentCFrame = me;


            var tmpCanvasWidth = parseInt(me.canvas.canvasElement.style.width);
            var tmpCanvasHeight = parseInt(me.canvas.canvasElement.style.height);

            var markerWidth = 16;
            var markerHeight = 16;

            //Offset from marker edge
            var edgeMargin = 16;

            //Lower right(R-D)
            var markerRD = new CMarkerWindow(
                me.myCanvasId + '_RD',
                tmpCanvasWidth - markerWidth + edgeMargin,
                tmpCanvasHeight - markerHeight + edgeMargin,
                markerWidth,
                markerHeight,
                0,
                'RD');

            markerRD.htmlElement.style.cursor = 'se-resize';//nw-resize';

            //Since only the deltaX and deltaY are acquired and the movement of the marker itself is
            // performed by CFrame_resize, the movement coefficient of the marker itself is set to 0.
            markerRD.htmlElement.argX = 0;
            markerRD.htmlElement.argY = 0;


            //Bottom(D-D)
            var markerDD = new CMarkerWindow(
                me.myCanvasId + '_DD',
                0,
                tmpCanvasHeight - markerHeight + edgeMargin,
                tmpCanvasWidth - markerWidth + edgeMargin,
                markerHeight,
                0,
                'DD');

            markerDD.htmlElement.style.cursor = 'n-resize';

            //Since only the deltaX and deltaY are acquired and the movement of the marker itself is
            // performed by CFrame_resize, the movement coefficient of the marker itself is set to 0.
            markerDD.htmlElement.argX = 0;
            markerDD.htmlElement.argY = 0;

            //Right(R-R)
            var markerRR = new CMarkerWindow(
                me.myCanvasId + '_RR',
                tmpCanvasWidth - markerWidth + edgeMargin,
                0,
                markerWidth,
                tmpCanvasHeight - markerHeight + edgeMargin,
                0,
                'RR');

            markerRR.htmlElement.style.cursor = 'w-resize';

            //Since only the deltaX and deltaY are acquired and the movement of the marker itself is
            // performed by CFrame_resize, the movement coefficient of the marker itself is set to 0.
            markerRR.htmlElement.argY = 0;
            markerRR.htmlElement.argX = 0;

            //Add size change marker to canvas.
            me.canvas.addBean(markerRD);
            me.canvas.addBean(markerDD);
            me.canvas.addBean(markerRR);

            //Method to remove size change marker (can not resize)
            me.removeMarkers = function () {
                me.canvas.removeBean(markerRD.id);
                me.canvas.removeBean(markerDD.id);
                me.canvas.removeBean(markerRR.id);
                me.htmlElement.style.cursor = 'default';
            };

            //TODO:Refactor
            me.removeMarkers2 = function () {
                me.canvas.removeBean(markerRD.id);
                me.canvas.removeBean(markerDD.id);
                me.canvas.removeBean(markerRR.id);
            };


            //add frameComponents[begin]
            for (var idx in appearance.frameComponents) {

                var frameComponent = appearance.frameComponents[idx];

                frameComponent.setFrame(me);

                //if frameComponent has special name 'closeButton', it will act as a close button.
                if ('closeButton' == frameComponent.id) {
                    frameComponent.htmlElement.onclick = me.close;
                }

                me.addFrameComponent(frameComponent);
            }
            //add frameComponents[end]

            //override the field
            me.htmlElement.style.backgroundColor = 'transparent';

            me.htmlElement.oncontextmenu = this.contextMenu;


            //The policy of Border drawing seems to be different between IE and FF.
            var caribVal = 0;


            me.caribValue = caribVal;

            me.htmlElement.style.borderWidth = me.exBorderWidth + 'px';

            me.htmlElement.style.width = (parseInt(me.htmlElement.style.width) - caribVal) + 'px';
            me.htmlElement.style.height = (parseInt(me.htmlElement.style.height) - caribVal + 1) + 'px';
            me.htmlElement.typeName = 'cwindow';
            me.htmlElement.overflow = 'auto';


            if (appearance.frameBorderStyle) {
                me.htmlElement.style.borderStyle = appearance.frameBorderStyle;
            }

            if (appearance.frameBoxShadow) {
                me.htmlElement.style.boxShadow = appearance.frameBoxShadow;
            }

            //TODO deprecation(because CIfFrame is extended this operation)
            if (parseInt(appearance.frameBorderWidthDefault) > 0) {
                me.htmlElement.style.borderWidth = appearance.frameBorderWidthDefault;
                me.htmlElement.style.borderColor = appearance.frameBorderColorDefault;
            }
            if (parseInt(appearance.frameBorderRadius) > 0) {
                me.htmlElement.style.borderRadius = appearance.frameBorderRadius;
            }


        }


        CFrame.prototype.setTitleBarClassName = function (classNameForDefault, classNameForFocused) {
            var me = this;
            if (classNameForDefault) {
                me.titleBarClassNameDefault = classNameForDefault;
                me.titleBarClassNameFocused = classNameForDefault;
            }
            if (classNameForFocused) {
                me.titleBarClassNameFocused = classNameForFocused;
            }
            return me;
        };
        /**
         * Add frameComponent(Wrapped DOM element like 'div' to display above the frame) to frame
         * @param frameComponent
         */
        CFrame.prototype.addFrameComponent = function (frameComponent) {
            var me = this;

            me.frameComponentMap[frameComponent.id] = frameComponent;
            me.canvas.canvasElement.appendChild(frameComponent.htmlElement);
            return me;
        };

        /**
         * Get stored frame component by id
         * @param frameComponent
         */
        CFrame.prototype.getFrameComponentElement = function (id) {
            var me = this;
            return me.frameComponentMap[id].htmlElement;
        };

        CFrame.prototype.removeFrameComponentById = function (frameComponentId) {
            var me = this;

            var frameComponent = me.frameComponentMap[frameComponentId];

            me.canvas.canvasElement.removeChild(frameComponent.htmlElement);
            delete me.frameComponentMap[frameComponentId];
        };
        CFrame.prototype.setTitle = function (str) {
            var me = this;
            if (me.showTitleBar) {

                var textNode = document.createTextNode(str);
                //firstChildのfirstChildがspan
                me.titleBar.firstChild.replaceChild(textNode, me.titleBar.firstChild.firstChild);
            }
            return me;
        };

        CFrame.prototype.resize = function (deltaLeft, deltaTop, deltaWidth, deltaHeight) {
            var me = this;

            var tmpLeft = parseInt(me.htmlElement.style.left);
            var tmpTop = parseInt(me.htmlElement.style.top);
            var tmpWidth = parseInt(me.htmlElement.style.width);
            var tmpHeight = parseInt(me.htmlElement.style.height);

            me.htmlElement.style.left = parseInt(tmpLeft + deltaLeft) + 'px';
            me.htmlElement.style.top = parseInt(tmpTop + deltaTop) + 'px';

            me.htmlElement.style.width = parseInt(tmpWidth + deltaWidth) + 'px';
            me.htmlElement.style.height = parseInt(tmpHeight + deltaHeight) + 'px';

            var tmpCanvasWidth = parseInt(me.canvas.canvasElement.style.width);
            var tmpCanvasHeight = parseInt(me.canvas.canvasElement.style.height);

            //Since canvasElement is a (0, 0) relative coordinate with respect to the parent element,
            // so it is not necessary to change left and top.
            me.canvas.canvasElement.style.width = ( tmpCanvasWidth + deltaWidth) + 'px';
            me.canvas.canvasElement.style.height = ( tmpCanvasHeight + deltaHeight) + 'px';

            if (me.showTitleBar) {

                //Change the size of the title bar. TitleAdjustWidth etc.
                //The reason why you do not have to use titleAdjustWidth is because
                // these scaling are done with differences (deltaX, deltaY).
                //Therefore, if you adjust with the titleAdjustWidth as
                // the initial value, the other will stretch relative.
                //You do not think you can use ifDelta
                me.titleBar.style.width = (tmpCanvasWidth + deltaWidth) + 'px';

            } else {


            }


            for (var beanName in me.canvas.beanList) {
                var tmpBean = me.canvas.beanList[beanName];

                if (tmpBean.htmlElement.typeName == 'cmarkerwindow') {
                    if (tmpBean.htmlElement.usage == 'RD') {
                        //Move the size change lower right(RD) marker according to the amount of movement.
                        tmpBean.htmlElement.style.left = (parseInt(tmpBean.htmlElement.style.left) + deltaWidth) + 'px';
                        tmpBean.htmlElement.style.top = (parseInt(tmpBean.htmlElement.style.top) + deltaHeight) + 'px';
                    }
                    else if (tmpBean.htmlElement.usage == 'DD') {
                        //Move the size change lower marker according to the movement amount.
                        // Do not move left.Only the width wil increase or decrease.
                        tmpBean.htmlElement.style.width = (parseInt(tmpBean.htmlElement.style.width) + deltaWidth) + 'px';
                        tmpBean.htmlElement.style.top = (parseInt(tmpBean.htmlElement.style.top) + deltaHeight) + 'px';
                    }
                    else if (tmpBean.htmlElement.usage == 'RR') {
                        //Move the size change right marker according to the movement amount
                        //Do not move top,Only the height will increase or decrease.
                        tmpBean.htmlElement.style.left = (parseInt(tmpBean.htmlElement.style.left) + deltaWidth) + 'px';
                        tmpBean.htmlElement.style.height = (parseInt(tmpBean.htmlElement.style.height) + deltaHeight) + 'px';
                    }

                }
            }
        };


        CFrame.prototype.canvasMouseDown = function (e) {
            var me = this;

            //Mousedown processing of CFrame.canvas


            document.body.ondrag = function () {
                return false;
            };
            document.body.onselectstart = function () {
                return false;
            };

            //'This' in this method indicates 'Cwindow.canvas.canvasElement'.
            if (this.parentCFrame.parentCanvas.mouseDownSource == null) {
                this.parentCFrame.parentCanvas.mouseDownSource = 'childcanvas';
            }


        };
        CFrame.prototype.mouseUp = function (e) {
            this.canvas.mouseUp(e);
        };

        CFrame.prototype.close = function (e) {
            //Close processing of CFrame from CloseButton
            this.parentObject.parentCanvas.removeBean(this.parentObject.id);
        };

        CFrame.prototype.closeFrame = function (e) {
            //Close processing of CFrame
            var me = this;

            this.parentCanvas.removeBean(me.windowId);

        };

        CFrame.prototype.contextMenu = function () {
            //If you issue the right-click menu in the window, set the source to CFrame.
            var contextMenuSource = 'CFrame';
            return false;
        };


        CFrame.prototype.setTitleBarTextColor = function (str) {
            var me = this;
            me.titleBar.style.color = str;
        };

        CFrame.prototype.setPosition = function (x, y, anchor) {
            var me = this;

            var frameWidth = me.getWidth();
            var frameHeight = me.getHeight();

            me._setPositionInternally(x, y, anchor, frameWidth, frameHeight);

            return me;
        };
        CFrame.prototype._setPositionInternally = function (x, y, anchor, frameWidth, frameHeight) {
            var me = this;

            if (anchor) {
                me.anchor = anchor;
            }

            if (!anchor || CALIGN.LEFT_TOP == anchor) {
                me.htmlElement.style.left = x + 'px';
                me.htmlElement.style.top = y + 'px';
            }
            else if (CALIGN.HCENTER_TOP == anchor) {
                me.htmlElement.style.left = (-frameWidth / 2 + x) + 'px';
                me.htmlElement.style.top = y + 'px';
            }
            else if (CALIGN.RIGHT_TOP == anchor) {
                me.htmlElement.style.left = (-frameWidth + x) + 'px';
                me.htmlElement.style.top = y + 'px';
            }
            else if (CALIGN.LEFT_VCENTER == anchor) {
                me.htmlElement.style.left = x + 'px';
                me.htmlElement.style.top = (-frameHeight / 2 + y) + 'px';
            }
            else if (CALIGN.HCENTER_VCENTER == anchor) {
                me.htmlElement.style.left = (-frameWidth / 2 + x) + 'px';
                me.htmlElement.style.top = (-frameHeight / 2 + y) + 'px';
            }
            else if (CALIGN.RIGHT_VCENTER == anchor) {
                me.htmlElement.style.left = (-frameWidth + x) + 'px';
                me.htmlElement.style.top = (-frameHeight / 2 + y) + 'px';
            }
            else if (CALIGN.LEFT_BOTTOM == anchor) {
                me.htmlElement.style.left = x + 'px';
                me.htmlElement.style.top = (-frameHeight + y) + 'px';
            }
            else if (CALIGN.HCENTER_BOTTOM == anchor) {
                me.htmlElement.style.left = (-frameWidth / 2 + x) + 'px';
                me.htmlElement.style.top = (-frameHeight + y) + 'px';
            }
            else if (CALIGN.RIGHT_BOTTOM == anchor) {
                me.htmlElement.style.left = (-frameWidth + x) + 'px';
                me.htmlElement.style.top = (-frameHeight + y) + 'px';
            }
        };

        /**
         * Returns relative position with anchor
         * @returns {{x: *, y: *, anchor: *}}
         */
        CFrame.prototype.getPosition = function () {
            var me = this;
            var frameWidth = me.getWidth();
            var frameHeight = me.getHeight();
            var x;
            var y;
            var anchor = me.anchor;
            if (!anchor || CALIGN.LEFT_TOP == anchor) {
                x = parseInt(me.htmlElement.style.left);
                y = parseInt(me.htmlElement.style.top);
            }
            else if (CALIGN.HCENTER_TOP == anchor) {
                x = parseInt(me.htmlElement.style.left) + frameWidth / 2;
                y = parseInt(me.htmlElement.style.top);
            }
            else if (CALIGN.RIGHT_TOP == anchor) {
                x = parseInt(me.htmlElement.style.left) + frameWidth;
                y = parseInt(me.htmlElement.style.top);
            }
            else if (CALIGN.LEFT_VCENTER == anchor) {
                x = parseInt(me.htmlElement.style.left);
                y = parseInt(me.htmlElement.style.top) + frameHeight / 2;
            }
            else if (CALIGN.HCENTER_VCENTER == anchor) {
                x = parseInt(me.htmlElement.style.left) + frameWidth / 2;
                y = parseInt(me.htmlElement.style.top) + frameHeight / 2;
            }
            else if (CALIGN.RIGHT_VCENTER == anchor) {
                x = parseInt(me.htmlElement.style.left) + frameWidth;
                y = parseInt(me.htmlElement.style.top) + frameHeight / 2;
            }
            else if (CALIGN.LEFT_BOTTOM == anchor) {
                x = parseInt(me.htmlElement.style.left);
                y = parseInt(me.htmlElement.style.top) + frameHeight;
            }
            else if (CALIGN.HCENTER_BOTTOM == anchor) {
                x = parseInt(me.htmlElement.style.left) + frameWidth / 2;
                y = parseInt(me.htmlElement.style.top) + frameHeight;
            }
            else if (CALIGN.RIGHT_BOTTOM == anchor) {
                x = parseInt(me.htmlElement.style.left) + frameWidth;
                y = parseInt(me.htmlElement.style.top) + frameHeight;
            }
            return {x: x, y: y, anchor: anchor};
        };

        CFrame.prototype.getLeft = function () {
            var me = this;
            return parseInt(me.htmlElement.style.left);
        };


        CFrame.prototype.getTop = function () {
            var me = this;
            return parseInt(me.htmlElement.style.top);
        };
        CFrame.prototype.getWidth = function () {
            var me = this;
            return parseInt(me.htmlElement.style.width);
        };
        CFrame.prototype.getHeight = function () {
            var me = this;
            return parseInt(me.htmlElement.style.height);
        };

        CFrame.prototype.setSize = function (width, height) {
            var me = this;

            me.resize(0, 0, width - me.getWidth(), height - me.getHeight(), true);
            return me;
        };

        CFrame.prototype.getWindowId = function () {
            var me = this;
            return me.windowId
        };
        /**
         * end of CFrame class
         */

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-


        inherit(CIfFrame, CFrame);

        /**
         * CIfFrame class
         * Extension class with contents frame of CFrame as iframe
         * @param windowId
         * @param appearance
         * @constructor
         */
        function CIfFrame(windowId, left, top, width, height, appearance) {


            var wleft = left;
            var wtop = top;
            var wwidth = width;
            var wheight = height;
            var zindex = appearance.zindex;
            var wborderwidth = null;


            var me = this;


            this.minFrameWidth = 128;
            this.minWindowHeight = 32;

            /**
             * If this value is true, the focus will move when tapping the iframe area,
             * but if the window do not have the focus, you can not click on the element in the iframe.
             */
            this.overrayTransparentScreenEnabled = false;

            /**
             *  Only in the case of resizing a transparent screen can be displayed on the iframe
             *  and the size can be adjusted smoothly.
             *  true is recommended.
             */
            this.overrayTransparentScreenOnResize = true;


            this.titleBarColorFocused = appearance.titleBarColorFocused;
            this.titleBarColorDefault = appearance.titleBarColorDefault;

            this.titleBarCaptionColorDefault = appearance.titleBarCaptionColorDefault;
            this.titleBarCaptionColorFocused = appearance.titleBarCaptionColorFocused;

            //call super constructor
            CIfFrame.superConstructor.call(me, windowId, wleft, wtop, wwidth, wheight, zindex, wborderwidth, appearance);

            //border color
            me.frameBorderColorDefault = appearance.frameBorderColorDefault;
            me.frameBorderColorFocused = appearance.frameBorderColorFocused;

            //border width
            me.frameBorderWidthDefault = appearance.frameBorderWidthDefault;
            me.frameBorderWidthFocused = appearance.frameBorderWidthFocused;


            me.iframe = null;


            //Offset value for width adjustment of iframe
            me.ifDelta = 0;

            me.resizable = true;


            me.onMouseMoveOnIframe = null;
            me.onMouseUpOnIframe = null;

            me._hasFocus = false;
            me._hasFocusTime = 0;


            me.htmlElement.typeName = 'cifwindow';

            //name of iframe
            var exIframeName = 'riversun_' + windowId;


            me.dframe = document.createElement('div');

            if (appearance.useFrame) {
                me.dframe.style.overflow = 'hidden';
                me.dframe.style.height = '100%';
                me.canvas.canvasElement.appendChild(me.dframe);
            }

            me.iframe = document.createElement('iframe');


            me.iframe.name = exIframeName;

            me.iframe.id = exIframeName;

            me.iframe.frameBorder = '0';
            me.iframe.scrolling = 'no';

            me.iframe.zIndex = -1;

            //Allow transparent of iframe background.
            me.iframe.allowTransparency = 'true';
            me.iframe.width = me.canvasNetWidth - me.ifDelta + 0;
            me.iframe.height = me.canvasNetHeight - me.ifDelta + 0;

            me.showTitleBar = appearance.showTitleBar;

            me.getFrameInnerBorderRadius = appearance.getFrameInnerBorderRadius;

            me.frameBorderRadius = appearance.frameBorderRadius;


            me.adjustFrameBorderRadius();

            if (appearance.useIframe) {
                //Add iframe to the canvas
                me.canvas.canvasElement.appendChild(me.iframe);
            } else {

            }


            //If it is IE, set the canvasElement of the canvas which is the parent of the iframe to transparent.

            if (me.overrayTransparentScreenEnabled || me.overrayTransparentScreenOnResize) {
                //Create a transparent screen.
                me.transparence = document.createElement('span');
                //me.transparence.style.backgroundImage = 'url(img/img_baron_tp.gif)';

                me.transparence.style.position = 'absolute';
                me.transparence.style.left = '0px';
                me.transparence.style.top = '0px';

                //Transparent screen is 0px when creating window
                me.transparence.style.width = '0px';
                me.transparence.style.height = '0px';

                me.transparence.style.zIndex = 4;
                me.transparence.style.borderWidth = '0px';
                me.transparence.style.borderColor = '#ff00ee';
                //this.transparence.style.borderStyle='none';
                me.transparence.style.cursor = 'default';

                me.canvas.canvasElement.style.backgroundColor = appearance.frameBackgroundColor;


                me.canvas.canvasElement.appendChild(me.transparence);
            }

        }


        CIfFrame.prototype.getFrameView = function () {
            var me = this;
            return  me.dframe;
        };

        CIfFrame.prototype.adjustFrameBorderRadius = function () {
            var me = this;

            if (parseInt(me.frameBorderRadius) > 0) {

                var innerBorderRadius = me.getFrameInnerBorderRadius(me, me._hasFocus);

                if (me.showTitleBar) {

                    //title bar exists
                    me.canvas.canvasElement.style.borderBottomRightRadius = innerBorderRadius;
                    me.canvas.canvasElement.style.borderBottomLeftRadius = innerBorderRadius;
                    me.iframe.style.borderBottomRightRadius = innerBorderRadius;
                    me.iframe.style.borderBottomLeftRadius = innerBorderRadius;

                    me.titleBar.style.borderTopLeftRadius = innerBorderRadius;
                    me.titleBar.style.borderTopRightRadius = innerBorderRadius;


                } else {

                    //title bar not exits
                    me.canvas.canvasElement.style.borderRadius = innerBorderRadius;
                    me.iframe.style.borderRadius = innerBorderRadius;

                }

                if (me.dframe) {
                    me.dframe.style.borderBottomRightRadius = innerBorderRadius;
                    me.dframe.style.borderBottomLeftRadius = innerBorderRadius;
                }


            }
        };

        CIfFrame.prototype.handleReleasingFocus = function (e) {
            var me = this;
            me._hasFocus = false;

            me.titleBar.style.backgroundColor = me.titleBarColorDefault;
            me.titleBar.style.color = me.titleBarCaptionColorDefault;

            //border color
            if (me.frameBorderColorDefault) {
                me.htmlElement.style.borderColor = me.frameBorderColorDefault;
            }

            //border width
            if (me.frameBorderWidthDefault) {
                me.htmlElement.style.borderWidth = me.frameBorderWidthDefault;
                me.adjustFrameBorderRadius();
            }

            if (me.htmlElement.typeName == 'cifwindow') {
                if (me.overrayTransparentScreenEnabled) {
                    me.transparence.style.width = parseInt(me.iframe.width) + 'px';
                    me.transparence.style.height = parseInt(me.iframe.height) + 'px';
                }
            }

            //handling for child frameComponents
            for (var frameComponentId in me.frameComponentMap) {
                var frameComponent = me.frameComponentMap[frameComponentId];
                frameComponent.handleReleasingFocus()
            }

            //border bottom
            if (me.titleBarBorderBottomDefault) {
                me.titleBar.style.borderBottom = me.titleBarBorderBottomDefault;
            }


            //update style class
            me.titleBar.className = me.titleBarClassNameDefault;

            return me;
        };

        CIfFrame.prototype.handleTakingFocus = function (e) {
            var me = this;
            me._hasFocus = true;
            me._hasFocus = Date.now();

            if (me.overrayTransparentScreenEnabled) {
                //close transparence screen
                me.transparence.style.width = '0px';
                me.transparence.style.height = '0px';
            }

            me.titleBar.style.backgroundColor = me.titleBarColorFocused;
            me.titleBar.style.color = me.titleBarCaptionColorFocused;


            //border color
            if (me.frameBorderColorFocused) {
                me.htmlElement.style.borderColor = me.frameBorderColorFocused;
            }

            //border width
            if (me.frameBorderWidthFocused) {
                me.htmlElement.style.borderWidth = me.frameBorderWidthFocused;
                me.adjustFrameBorderRadius();
            }

            //border bottom
            if (me.titleBarBorderBottomFocused) {
                me.titleBar.style.borderBottom = me.titleBarBorderBottomFocused;
            }

            //handling for child frameComponents
            for (var frameComponentId in me.frameComponentMap) {
                var frameComponent = me.frameComponentMap[frameComponentId];
                frameComponent.handleTakingFocus()
            }


            //update style class
            me.titleBar.className = me.titleBarClassNameFocused;
            return me;
        };


        CIfFrame.prototype.show = function () {
            var me = this;
            me.htmlElement.style.visibility = 'visible';
            me.requestFocus();
            return me;
        };

        CIfFrame.prototype.hide = function () {
            var me = this;
            me.htmlElement.style.visibility = 'hidden';
            return me;
        };

        //Overriding CBeanFrame.prototype.onmouseDown
        CIfFrame.prototype.onmouseDown = function (e) {

            var refHtmlElement = this;

            //Do not select it when dragging by the mouse.
            document.body.ondrag = function () {
                return false;
            };
            document.body.onselectstart = function () {
                return false;
            };


            //Override decorator with onmouseDown of parent class
            refHtmlElement.decorator = CFrame.prototype.onmouseDown;
            refHtmlElement.decorator(e);

            //Deploy a transparent screen.
            // Since mouseDown is pointed to this.htmlElement.onmousedown in the CBean class,
            // this 'this' will indicate this.htmlElement.
            //In other words,
            //if you want to refer 'CIfFrame',you need to specify 'this.parent.'
            //See CBeanFrame class, you can find 'this.htmlElement.parent = this'
            var refCIfFrame = refHtmlElement.parent;


            var refCWindowManager = refHtmlElement.parentCanvas;

            //When somewhere window(CFrame,CIfFrame) fires 'mouseDown',
            // Close all transparency screens so that the mouse cursor can pass over any iFrame
            for (var windowId in refCWindowManager.beanList) {
                var objCIfFrame = refCWindowManager.beanList[windowId];
                if (windowId == refCIfFrame.getWindowId()) {
                    //skip
                } else {
                    objCIfFrame.handleReleasingFocus();
                }
            }

            refCIfFrame.handleTakingFocus();

        };

        CIfFrame.prototype.mouseUp = function (e) {
            var refCIfFrame = this;


            if (refCIfFrame.overrayTransparentScreenEnabled || refCIfFrame.overrayTransparentScreenOnResize) {
                if (refCIfFrame.parentCanvas.onTopObject == refCIfFrame) {
                    //Minimize the window at the front.
                    refCIfFrame.transparence.style.width = '0px';
                    refCIfFrame.transparence.style.height = '0px';
                } else {
                    //The window which is not the at the front expands the screen so that it can respond to clicks.

                    if (refCIfFrame.overrayTransparentScreenEnabled) {
                        refCIfFrame.transparence.style.width = parseInt(refCIfFrame.iframe.width) + 'px';
                        refCIfFrame.transparence.style.height = parseInt(refCIfFrame.iframe.height) + 'px';
                    }
                }
            }

            refCIfFrame.decorator = CFrame.prototype.mouseUp;
            refCIfFrame.decorator(e);


            //Cancel selecting "Do not select when dragging mouse while releasing button" is canceled
            document.body.ondrag = null;
            document.body.onselectstart = null;

        };

        CIfFrame.prototype.setMinFrameSize = function (width, height) {
            var me = this;
            me.minFrameWidth = width;
            me.minWindowHeight = height;
        };

        CIfFrame.prototype.resize = function (deltaLeft, deltaTop, deltaWidth, deltaHeight, byUser) {

            var refCIfFrame = this;


            if (!refCIfFrame.resizable) {
                return null;
            }


            //Resize processing should be overridden directly rather than adopting a decorator pattern because it has better performance.
            var tmpLeft = parseInt(refCIfFrame.htmlElement.style.left);
            var tmpTop = parseInt(refCIfFrame.htmlElement.style.top);
            var tmpWidth = parseInt(refCIfFrame.htmlElement.style.width);
            var tmpHeight = parseInt(refCIfFrame.htmlElement.style.height);

            //Important logic to handle the minimum of Window well
            if (byUser && (tmpWidth + deltaWidth < refCIfFrame.minFrameWidth & deltaWidth < 0)) {
                //Minimum adjustment of width
                refCIfFrame.htmlElement.style.width = tmpWidth + 'px';
                deltaWidth = 0;
            }

            if (byUser && (tmpHeight + deltaHeight < refCIfFrame.minWindowHeight & deltaHeight < 0)) {
                //Minimum adjustment of height
                refCIfFrame.htmlElement.style.height = tmpHeight;
                deltaHeight = 0;
            }
            refCIfFrame.htmlElement.style.left = ( tmpLeft + deltaLeft) + 'px';
            refCIfFrame.htmlElement.style.top = ( tmpTop + deltaTop) + 'px';
            refCIfFrame.htmlElement.style.width = (tmpWidth + deltaWidth) + 'px';
            refCIfFrame.htmlElement.style.height = (tmpHeight + deltaHeight) + 'px';


            var tmpCanvasWidth = parseInt(refCIfFrame.canvas.canvasElement.style.width);
            var tmpCanvasHeight = parseInt(refCIfFrame.canvas.canvasElement.style.height);

            //Since canvasElement is a (0, 0) relative coordinate with respect
            // to the parent element, it is not necessary to change left and top.
            refCIfFrame.canvas.canvasElement.style.width = (tmpCanvasWidth + deltaWidth) + 'px';
            refCIfFrame.canvas.canvasElement.style.height = (tmpCanvasHeight + deltaHeight) + 'px';

            //Change the size of the title bar. TitleAdjustWidth etc.
            // The reason why you do not have to use titleAdjustWidth is
            // because these scaling are done with differences (deltaX, deltaY).
            //Therefore, if you adjust with the titleAdjustWidth
            // as the initial value, the other will stretch relative.
            refCIfFrame.titleBar.style.width = (tmpCanvasWidth - refCIfFrame.ifDelta + deltaWidth + 0) + 'px';

            //Image resizing for iframe that is the child element of canvas
            refCIfFrame.iframe.width = (tmpCanvasWidth - refCIfFrame.ifDelta + deltaWidth + 0 ) + 'px';
            refCIfFrame.iframe.height = (tmpCanvasHeight - refCIfFrame.ifDelta + deltaHeight + refCIfFrame.frameHeightAdjust) + 'px';


            if (refCIfFrame.overrayTransparentScreenEnabled || refCIfFrame.overrayTransparentScreenOnResize) {
                //Deploy a transparent screen.
                refCIfFrame.transparence.style.width = parseInt(refCIfFrame.iframe.width) + 'px';
                refCIfFrame.transparence.style.height = parseInt(refCIfFrame.iframe.height) + 'px';
            }

            //move frameComponent(like closeButton) corresponding to moving window edge for resize
            for (var frameComponentId in refCIfFrame.frameComponentMap) {
                var frameComponent = refCIfFrame.frameComponentMap[frameComponentId];
                //update alignment of frameComponent corresponding to moving window edge for resize
                frameComponent.updateAlign()
            }


            for (var beanName in refCIfFrame.canvas.beanList) {
                var tmpBean = refCIfFrame.canvas.beanList[beanName];

                if (tmpBean.htmlElement.typeName == 'cmarkerwindow') {

                    if (tmpBean.htmlElement.usage == 'RD') {
                        tmpBean.htmlElement.style.left = (parseInt(tmpBean.htmlElement.style.left) + deltaWidth) + 'px';
                        tmpBean.htmlElement.style.top = (parseInt(tmpBean.htmlElement.style.top) + deltaHeight) + 'px';
                    }
                    else if (tmpBean.htmlElement.usage == 'DD') {
                        tmpBean.htmlElement.style.width = (parseInt(tmpBean.htmlElement.style.width) + deltaWidth ) + 'px';
                        tmpBean.htmlElement.style.top = (parseInt(tmpBean.htmlElement.style.top) + deltaHeight) + 'px';
                    }
                    else if (tmpBean.htmlElement.usage == 'RR') {
                        tmpBean.htmlElement.style.left = (parseInt(tmpBean.htmlElement.style.left) + deltaWidth ) + 'px';
                        tmpBean.htmlElement.style.height = (parseInt(tmpBean.htmlElement.style.height) + deltaHeight) + 'px';
                    }
                }
            }
        };//resize

        CIfFrame.prototype.resizeDirect = function (width, height, byUser) {

            var refCIfFrame = this;


            if (!refCIfFrame.resizable) {
                return null;
            }

            refCIfFrame.htmlElement.style.width = width + 'px';
            refCIfFrame.htmlElement.style.height = height + 'px';


            var tmpCanvasWidth = parseInt(refCIfFrame.canvas.canvasElement.style.width);
            var tmpCanvasHeight = parseInt(refCIfFrame.canvas.canvasElement.style.height);

            //Since canvasElement is a (0, 0) relative coordinate with respect
            // to the parent element, it is not necessary to change left and top.
            refCIfFrame.canvas.canvasElement.style.width = width + 'px';
            refCIfFrame.canvas.canvasElement.style.height = height + 'px';

            //Change the size of the title bar. TitleAdjustWidth etc.
            // The reason why you do not have to use titleAdjustWidth is
            // because these scaling are done with differences (deltaX, deltaY).
            //Therefore, if you adjust with the titleAdjustWidth
            // as the initial value, the other will stretch relative.
            refCIfFrame.titleBar.style.width = (width - refCIfFrame.ifDelta) + 'px';

            //Image resizing for iframe that is the child element of canvas
            refCIfFrame.iframe.width = width - refCIfFrame.ifDelta + 'px';
            refCIfFrame.iframe.height = height - refCIfFrame.ifDelta + refCIfFrame.frameHeightAdjust + 'px';


            if (refCIfFrame.overrayTransparentScreenEnabled || refCIfFrame.overrayTransparentScreenOnResize) {
                //Deploy a transparent screen.
                refCIfFrame.transparence.style.width = parseInt(refCIfFrame.iframe.width) + 'px';
                refCIfFrame.transparence.style.height = parseInt(refCIfFrame.iframe.height) + 'px';
            }

            //move frameComponent(like closeButton) corresponding to moving window edge for resize
            for (var frameComponentId in refCIfFrame.frameComponentMap) {
                var frameComponent = refCIfFrame.frameComponentMap[frameComponentId];
                //update alignment of frameComponent corresponding to moving window edge for resize
                frameComponent.updateAlign()
            }


            for (var beanName in refCIfFrame.canvas.beanList) {
                var tmpBean = refCIfFrame.canvas.beanList[beanName];

                if (tmpBean.htmlElement.typeName == 'cmarkerwindow') {

                    if (tmpBean.htmlElement.usage == 'RD') {
                        tmpBean.htmlElement.style.left = width + 'px';// parseInt(tmpBean.htmlElement.style.left) + deltaWidth + 'px';
                        tmpBean.htmlElement.style.top = height + 'px';//parseInt(tmpBean.htmlElement.style.top) + deltaHeight + 'px';
                    }
                    else if (tmpBean.htmlElement.usage == 'DD') {
                        tmpBean.htmlElement.style.width = width + 'px';
                        tmpBean.htmlElement.style.top = height + 'px';//heightparseInt(tmpBean.htmlElement.style.top) + deltaHeight + 'px';
                    }
                    else if (tmpBean.htmlElement.usage == 'RR') {
                        tmpBean.htmlElement.style.left = width + 'px';//+parseInt(tmpBean.htmlElement.style.left) + deltaWidth + 'px';
                        tmpBean.htmlElement.style.height = height + 'px';
                    }
                }
            }
        };//resize

        /**
         * Focus on this frame
         */
        CIfFrame.prototype.requestFocus = function () {


            var me = this;

            var beanList = me.parentCanvas.beanList;

            for (var windowId in beanList) {

                var tmpIfWindow = beanList[windowId];

                //If it's my own window, minimize the transparent screen and change the color of the title bar.
                if (windowId == me.getWindowId()) {

                    //if this frame is a target frame
                    tmpIfWindow.handleTakingFocus();
                }
                else {

                    //if this frame is NOT a target frame
                    tmpIfWindow.handleReleasingFocus();
                }
            }

        };

        /**
         * URL for iframe
         * @param url
         */
        CIfFrame.prototype.setUrl = function (url) {

            var me = this;

            return new Promise(function (resolve, reject) {


                me.iframe.src = url;
                me.iframe.onload = function () {

                    //mouse move
                    me.iframe.contentWindow.document.onmousemove = function (e) {
                        var frameLeft = me.getLeft();
                        var frameTop = me.getTop();

                        var eventFromIframe = document.createEvent('MouseEvents');
                        eventFromIframe.initMouseEvent('mousemove', true, false, window, e.detail, e.screenX, e.screenY, (e.pageX + frameLeft), (e.pageY + frameTop),
                            e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.button, null);

                        //smooth dragging during iframe mode
                        me.parentCanvas.windowMouseMove(eventFromIframe);

                        if (me.onMouseMoveOnIframe) {
                            me.onMouseMoveOnIframe(eventFromIframe);
                        }
                    };

                    //mouse up
                    me.iframe.contentWindow.document.onmouseup = function (e) {
                        var frameLeft = me.getLeft();
                        var frameTop = me.getTop();

                        var eventFromIframe = document.createEvent('MouseEvents');
                        eventFromIframe.initMouseEvent('mouseup', true, false, window, e.detail, e.screenX, e.screenY, (e.pageX + frameLeft), (e.pageY + frameTop),
                            e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.button, null);

                        //smooth dragging during iframe mode
                        me.parentCanvas.windowMouseUp(eventFromIframe);

                        if (me.onMouseUpOnIframe) {
                            me.onMouseUpOnIframe(eventFromIframe);
                        }

                    };


                    resolve(me.iframe.contentWindow.document);
                };


            });


        };


        /**
         * Returns DOM-document of iframe
         * @returns {*|HTMLDocument}
         */
        CIfFrame.prototype.getIfDocument = function () {
            var me = this;
            return me.iframe.contentWindow.document;
        };

        CIfFrame.prototype.setScrolling = function (str) {
            var me = this;
            me.iframe.scrolling = str;
        };

        CIfFrame.prototype.getScrolling = function (str) {
            var me = this;
            return me.iframe.scrolling
        };


        CIfFrame.prototype.setResizable = function (enabled) {
            var me = this;

            me.resizable = enabled;
            if (!enabled) {
                me.removeMarkers2();
            }
            return me;
        };
        /**
         * end of CIFrame class
         */

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-


        inherit(CWindowManager, CCanvas);

        /**
         * CWindowManager class
         * <p>
         * A canvas class that displays multiple frames. Handle events on the window to coordinate multiple windows<br>
         *
         * @param parentElement
         * @param canvasId
         * @param left
         * @param top
         * @param width
         * @param height
         * @constructor
         */
        function CWindowManager(parentElement, canvasId, left, top, width, height) {
            CWindowManager.superConstructor.call(this, parentElement, canvasId, left, top, width, height);
            var me = this;
        }

        CWindowManager.prototype.getWindow = function (windowId) {
            var me = this;
            return me.beanList[windowId];
        };

        //Wrapping the 'addBean' of the parent class
        CWindowManager.prototype.addWindow = function (window) {
            var me = this;
            me.addBean(window);
        };

        //Wrapping the 'mouseMove' method of the parent class
        CWindowManager.prototype.windowMouseMove = function (e) {
            var me = this;
            if (me.currentObject == null) {

                return null;
            }

            var childWindowMoved = false;

            //Loop processing of each CWindow held by CWindowManager
            var beanList = me.beanList;

            for (var windowId in  beanList) {

                var targetWindow = beanList[windowId];


                //Since this 'mouseMove' is canvas of CWindow's 'mouseMove',so do move CBeanFrames in the canvas.
                var eventData = targetWindow.canvas.mouseMove(e);

                //Whether any one of the beans in the Canvas has moved or not.
                //Yes.(When it moves), eventData is set.
                //NO. If it does not move it is set to null.
                childWindowMoved = childWindowMoved | (eventData != null);
                if (eventData != null) {

                    //If it is the marker for resizing
                    if (eventData.targetTypeName == 'cmarkerwindow') {

                        var targetObject = eventData.targetObject;

                        if (targetObject.usage == 'RD') {
                            targetWindow.resize(0, 0, eventData.deltaX, eventData.deltaY, true);
                        }

                        else if (targetObject.usage == 'DD') {
                            targetWindow.resize(0, 0, 0, eventData.deltaY, true);
                        }

                        else if (targetObject.usage == 'RR') {
                            targetWindow.resize(0, 0, eventData.deltaX, 0, true);
                        }

                    }
                }
            }

            //If any one of the beans in the Canvas has moved.Do not do 'Cwindow's mouseMove'
            if (!childWindowMoved && this.mouseDownSource != 'childcanvas') {

                //Moving logic for CWindow which is holded by CWindowManager as a child window.
                me.mouseMove(e);
            }

        };

        //Wrapping the method 'mouseUp' of the parent class
        CWindowManager.prototype.windowMouseUp = function (e) {
            var me = this;

            //run 'mouseUp' of parent class
            me.mouseUp(e);

            var beanList = me.beanList;

            for (var windowId in  beanList) {

                var objWindow = beanList[windowId];

                //run CWindow's 'mouseUp'(it's child window).
                objWindow.mouseUp(e);
            }

        };

        /**
         * (override CCanvas.removeBean)
         * @param windowId
         */
        CWindowManager.prototype.removeBean = function (windowId) {


            var me = this;

            //Retrieve the target beanFrame
            var beanList = me.beanList;
            var targetBean = beanList[windowId];

            if (targetBean == null) {
                return;
            }

            var removeTargetBeanHasFocus = targetBean._hasFocus;


            //Remove bean's htmlElement from canvasElement
            me.canvasElement.removeChild(targetBean.htmlElement);

            //Delete the bean object in the associative array.
            delete beanList[windowId];

            //focus on last focused window after removing
            var maxFocusTime = 0;
            var lastFocusedFrame = null;

            if (removeTargetBeanHasFocus) {
                for (var windowId in beanList) {
                    var frame = beanList[windowId];
                    if (maxFocusTime <= frame._hasFocusTime) {
                        maxFocusTime = frame._hasFocusTime;
                        lastFocusedFrame = frame;
                    }
                }
                if (lastFocusedFrame) {
                    lastFocusedFrame.requestFocus();
                }
            }
        };
        /**
         * end of CWindowManager class
         */

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

        inherit(CMarkerWindow, CBeanFrame);
        /**
         * CMarkerWindow class
         * @param windowId
         * @param left
         * @param top
         * @param width
         * @param height
         * @param zindex
         * @param usage
         * @constructor
         */
        function CMarkerWindow(windowId, left, top, width, height, zindex, usage) {

            var me = this;

            CMarkerWindow.superConstructor.call(this, windowId, left, top, width, height, zindex, usage);

            me.htmlElement.typeName = 'cmarkerwindow';
            me.htmlElement.usage = usage;
            me.htmlElement.isRangeLimited = false;
            me.htmlElement.style.borderStyle = 'none';
            me.htmlElement.style.zIndex = 4;

        }

        /**
         * End of CMarkerWindow class
         * @constructor
         */

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

        /**
         * FrameManager class
         * @constructor
         */
        function FrameManager() {

            var me = this;


            document.onmouseup = mouseUp;
            document.onmousemove = mouseMove;

            me.windowManager = new CWindowManager(document.body, 'windowManager_' + me.generateUUID(), 0, 0, 0, 0);
            me.domPartsBuilder = null;


            function mouseUp(e) {
                me.windowManager.windowMouseUp(e);
            }

            function mouseMove(e) {
                me.windowManager.windowMouseMove(e);
                var globalMouseX = e.pageX;
                var globalMouseY = e.pageY;
            }


        }

        FrameManager.prototype.getDomPartsBuilder = function () {
            var me = this;

            if (!me.domPartsBuilder) {
                me.domPartsBuilder = new CDomPartsBuilder();
            }
            return me.domPartsBuilder;
        };


        /**
         * Create a new window
         *
         * @returns {CIfFrame}
         */
        FrameManager.prototype.createFrame = function (left, top, width, height, appearance) {
            var me = this;

            if (!appearance) {
                appearance = me.createFrameAppearance();
            }

            appearance.initialize();

            var windowId = 'window_' + me.generateUUID();

            var frame = new CIfFrame(windowId, left, top, width, height, appearance);

            frame.hide();

            me.windowManager.addWindow(frame);


            return frame;

        };


        FrameManager.prototype.generateUUID = function () {

            var unixTime = Date.now();

            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (unixTime + Math.random() * 16) % 16 | 0;
                unixTime = Math.floor(unixTime / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;

        };

        FrameManager.prototype.createFrameAppearance = function () {
            return new CFrameAppearance();
        };

        FrameManager.prototype.createAnimator = function () {

            return new CSimpleLayoutAnimator();
        };
        /**
         * end of FrameManager class
         */

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

        /**
         * CFrameComponent class
         * <p>
         * Wrapped DOM element like 'div' to display above the frame<br>
         *
         * ex.An object such as closeButton
         *
         * @param id
         * @param frame
         * @param htmlElement DOM-element
         * @param x relative x-position in the frame respect to align
         * @param y relative y-position in the frame respect to align
         * @param align relative alignment in the frame
         * @constructor
         */
        function CFrameComponent(id, htmlElement, x, y, align) {
            var me = this;

            me.id = id;
            me.x = x;
            me.y = y;
            me.frame = null;

            me._focusTakingCallabck = null;
            me._focusReleasingCallabck = null;

            if (align) {
                me.frameComponentAlign = align;
            } else {
                me.frameComponentAlign = CALIGN.LEFT_TOP;
            }

            me.htmlElement = htmlElement;
            me.htmlElement.style.zIndex = 50;

        }

        CFrameComponent.prototype.setFocusCallback = function (focusTakingCallback, focusReleasingCallback) {
            var me = this;
            me._focusTakingCallabck = focusTakingCallback;
            me._focusReleasingCallabck = focusReleasingCallback;
        };

        /**
         * Set parent frame of this frameComponent
         * @param frame
         */
        CFrameComponent.prototype.setFrame = function (frame) {
            var me = this;

            me.frame = frame;
            me.htmlElement.parentObject = frame;
            me.updateAlign();
        };

        /**
         * Place the FrameComponent relative to the parent's frame.
         * Relocate relative to parent frame when window resize event occurs
         */
        CFrameComponent.prototype.updateAlign = function () {

            var me = this;

            var frameComponentAlign = me.frameComponentAlign;

            var frame = me.frame;
            var eleStyle = me.htmlElement.style;
            eleStyle.userSelect = 'none';

            var x = me.x;
            var y = me.y;

            var frameWidth = frame.getWidth();
            var frameHeight = frame.getHeight();
            var eleStyleWidth = eleStyle.width;
            var eleStyleHeight = eleStyle.height;

            if (CALIGN.LEFT_TOP == frameComponentAlign) {
                eleStyle.left = x + 'px';
                eleStyle.top = y + 'px';
            }
            else if (CALIGN.HCENTER_TOP == frameComponentAlign) {
                eleStyle.left = (parseInt(frameWidth) / 2 - parseInt(eleStyleWidth) / 2 + x) + 'px';
                eleStyle.top = y + 'px';
            }
            else if (CALIGN.RIGHT_TOP == frameComponentAlign) {
                eleStyle.left = (parseInt(frameWidth) - parseInt(eleStyleWidth) + x) + 'px';
                eleStyle.top = y + 'px';
            }
            else if (CALIGN.LEFT_VCENTER == frameComponentAlign) {
                eleStyle.left = x + 'px';
                eleStyle.top = (parseInt(frameHeight) / 2 - parseInt(eleStyleHeight) / 2 + y) + 'px';
            }
            else if (CALIGN.HCENTER_VCENTER == frameComponentAlign) {
                eleStyle.left = (parseInt(frameWidth) / 2 - parseInt(eleStyleWidth) / 2 + x) + 'px';
                eleStyle.top = (parseInt(frameHeight) / 2 - parseInt(eleStyleHeight) / 2 + y) + 'px';
            }
            else if (CALIGN.RIGHT_VCENTER == frameComponentAlign) {
                eleStyle.left = (parseInt(frameWidth) - parseInt(eleStyleWidth) + x) + 'px';
                eleStyle.top = (parseInt(frameHeight) / 2 - parseInt(eleStyleHeight) / 2 + y) + 'px';
            }
            else if (CALIGN.LEFT_BOTTOM == frameComponentAlign) {
                eleStyle.left = x + 'px';
                eleStyle.top = (parseInt(frameHeight) - parseInt(eleStyleHeight) + y) + 'px';
            }
            else if (CALIGN.HCENTER_BOTTOM == frameComponentAlign) {
                eleStyle.left = (parseInt(frameWidth) / 2 - parseInt(eleStyleWidth) / 2 + x) + 'px';
                eleStyle.top = (parseInt(frameHeight) - parseInt(eleStyleHeight) + y) + 'px';
            }
            else if (CALIGN.RIGHT_BOTTOM == frameComponentAlign) {
                eleStyle.left = (parseInt(frameWidth) - parseInt(eleStyleWidth) + x) + 'px';
                eleStyle.top = (parseInt(frameHeight) - parseInt(eleStyleHeight) + y) + 'px';
            }
        };

        CFrameComponent.prototype.handleTakingFocus = function () {
            var me = this;
            if (me._focusTakingCallabck) {
                me._focusTakingCallabck();
            }
        };

        CFrameComponent.prototype.handleReleasingFocus = function () {
            var me = this;
            if (me._focusReleasingCallabck) {
                me._focusReleasingCallabck();
            }
        };

        /**
         * end of CFrameComponent class
         */

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-


        /**
         * CDomPartsBuilder class
         * Easy to build a beautiful or typical dom parts(htmlElement)
         * @constructor
         */
        function CDomPartsBuilder() {
        }

        CDomPartsBuilder.prototype.buildTextButtonAppearance = function () {
            return new CTextButtonAppearance();
        };
        /**
         *
         * @param size
         * @returns {HTMLElement}
         */
        CDomPartsBuilder.prototype.buildTextButton = function (btnAppearance) {

            var size = btnAppearance.size;
            var width = size;
            var height = size;

            if (btnAppearance.width != null) {
                width = btnAppearance.width;
            }

            if (btnAppearance.height != null) {
                height = btnAppearance.height;
            }


            var divElement = document.createElement('div');

            //border
            var borderWidth = btnAppearance.borderWidth;
            var borderRadius = btnAppearance.borderRadius;

            var borderColorDefault = btnAppearance.borderColorDefault;
            var borderColorFocused = btnAppearance.borderColorFocused;
            var borderColorHovered = btnAppearance.borderColorHovered;
            var borderColorPressed = btnAppearance.borderColorPressed;

            var borderStyleDefault = btnAppearance.borderStyleDefault;
            var borderStyleFocused = btnAppearance.borderStyleFocused;
            var borderStyleHovered = btnAppearance.borderStyleHovered;
            var borderStylePressed = btnAppearance.borderStylePressed;

            //background
            var backgroundColorDefault = btnAppearance.backgroundColorDefault;
            var backgroundColorFocused = btnAppearance.backgroundColorFocused;
            var backgroundColorHovered = btnAppearance.backgroundColorHovered;
            var backgroundColorPressed = btnAppearance.backgroundColorPressed;

            var backgroundBoxShadow = btnAppearance.backgroundBoxShadow;


            //caption
            var caption = btnAppearance.caption;

            var captionColorDefault = btnAppearance.captionColorDefault;
            var captionColorFocused = btnAppearance.captionColorFocused;
            var captionColorHovered = btnAppearance.captionColorHovered;
            var captionColorPressed = btnAppearance.captionColorPressed;

            var captionShiftYpx = btnAppearance.captionShiftYpx;
            var captionFontRatio = btnAppearance.captionFontRatio;

            //Set whether parent frame has focus or not internally
            divElement._hasFrameFocus = false;

            //Set whether mouse is pressing or not internally.
            divElement._isMouseDown = false;

            divElement.style.position = 'absolute';

            divElement.style.top = '0px';
            divElement.style.left = '0px';
            divElement.style.width = (width) + 'px';
            divElement.style.height = (height) + 'px';
            divElement.style.cursor = 'pointer';

            divElement.onmousedown = function (e) {
                divElement._isMouseDown = true;
                divElement._handleFocusDrawing();
            };

            divElement.onmouseout = function (e) {
                divElement._isMouseDown = false;
                divElement._handleFocusDrawing();
            };
            divElement.onmouseover = function (e) {
                divElement._handleHoverDrawing();
            };

            divElement.onmouseup = function (e) {
                divElement._isMouseDown = false;
                divElement._handleFocusDrawing();
            };


            /**
             * The parent notifies that the parent's frame got focus
             */
            divElement._onTakeFocus = function () {
                divElement._hasFrameFocus = true;
                divElement._handleFocusDrawing();
            };

            /**
             * The parent notifies that the parent's frame has lost focus
             */
            divElement._onReleaseFocus = function () {
                divElement._hasFrameFocus = false;
                divElement._handleFocusDrawing();
            };

            /**
             *  To handle 2x2 matrix.
             *  (_hasFrameFocus true/false x _isMouseDown true/false)
             */
            divElement._handleFocusDrawing = function () {


                if (divElement._hasFrameFocus) {
                    //When this element has focus

                    if (divElement._isMouseDown) {
                        //border
                        divElement.style.borderColor = borderColorPressed;
                        divElement.style.borderStyle = borderStylePressed;

                        //background
                        divElement.style.backgroundColor = backgroundColorPressed;

                        //caption
                        divElement.style.color = captionColorPressed;
                    } else {
                        //border
                        divElement.style.borderColor = borderColorFocused;
                        divElement.style.borderStyle = borderStyleFocused;

                        //background
                        divElement.style.backgroundColor = backgroundColorFocused;

                        //caption
                        divElement.style.color = captionColorFocused;


                    }

                } else {
                    //When this element doesn't have focus
                    if (divElement._isMouseDown) {
                        //border
                        divElement.style.borderColor = borderColorPressed;
                        divElement.style.borderStyle = borderStylePressed;

                        //background
                        divElement.style.backgroundColor = backgroundColorPressed;

                        //caption
                        divElement.style.color = captionColorPressed;
                    } else {
                        //border
                        divElement.style.borderColor = borderColorDefault;
                        divElement.style.borderStyle = borderStyleDefault;

                        //background
                        divElement.style.backgroundColor = backgroundColorDefault;

                        //caption
                        divElement.style.color = captionColorDefault;
                    }
                }
            };

            divElement._handleHoverDrawing = function () {

                if (divElement._hasFrameFocus) {
                    //When this element has focus
                } else {
                    //When this element doesn't have focus
                }
                //border
                if (borderColorHovered) {
                    divElement.style.borderColor = borderColorHovered;
                }
                if (borderStyleHovered) {
                    divElement.style.borderStyle = borderStyleHovered;
                }

                //background
                if (backgroundColorHovered) {
                    divElement.style.backgroundColor = backgroundColorHovered;
                }

                if (captionColorHovered) {
                    //caption
                    divElement.style.color = captionColorHovered;
                }
            }
            ;


            divElement.style.textAlign = 'center';
            divElement.style.fontSize = (height * captionFontRatio) + 'px';

            divElement.style.lineHeight = (height) + 'px';

            divElement.style.borderWidth = '1px';

            if (borderWidth != null) {
                divElement.style.borderWidth = borderWidth + 'px';
            }

            if (backgroundBoxShadow != null) {
                divElement.style.boxShadow = backgroundBoxShadow;
            }

            divElement.style.borderRadius = (borderRadius + parseInt(divElement.style.borderWidth)) + 'px';

            const childMode = true;
            if (childMode && caption) {
                var span = document.createElement('span');
                //span.style.position='absolute';
                span.style.width = '100%';
                span.style.marginTop = parseInt(captionShiftYpx);
                span.style.display = 'inline-block';
                span.style.textAlign = 'center';
                span.appendChild(document.createTextNode(caption));

                divElement.appendChild(span);
            } else if (!childMode && caption) {
                divElement.style.paddingTop = parseInt(captionShiftYpx) + 'px';
                divElement.appendChild(document.createTextNode(caption));
            }

            divElement._handleFocusDrawing();
            return divElement;

        };

        function CTextButtonAppearance() {

            const crossMark0 = '\u274c';

            this.size = 14;
            this.width = null;
            this.height = null;

            //border
            this.borderRadius = 2;
            this.borderWidth = 0;
            this.borderColorDefault = '#aaaaaa';
            this.borderColorFocused = this.borderColorDefault;
            this.borderColorHovered = null;
            this.borderColorPressed = this.borderColorDefault;

            this.borderStyleDefault = 'solid';
            this.borderStyleFocused = this.borderStyleDefault;
            this.borderStyleHovered = null;
            this.borderStylePressed = this.borderStyleDefault;

            this.backgroundBoxShadow = null;


            //background
            this.backgroundColorDefault = 'transparent';
            this.backgroundColorFocused = this.backgroundColorDefault;
            this.backgroundColorHovered = null;
            this.backgroundColorPressed = this.backgroundColorDefault;

            //caption
            this.caption = crossMark0;
            this.captionColorDefault = 'white';
            this.captionColorFocused = this.captionColorDefault;
            this.captionColorHovered = null;
            this.captionColorPressed = this.captionColorDefault;
            this.captionShiftYpx = 0;
            this.captionFontRatio = 1.0;


        }

        /**
         * end of CDomPartsBuilder class
         */

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

        /**
         * CSimpleLayoutAnimator class
         * Class for moving animation · scaling animation of frame.
         * <p>
         * @constructor
         */
        function CSimpleLayoutAnimator() {

            this.fps = 30;
            this.durationMillis = 200;
            this.targetFrame = null;

            //current width/height
            this._crrWidth = 0;
            this._crrHeight = 0;
            this._toWidth = 0;
            this._toHeight = 0;

            //current position(x,y)
            //this._crrX = 0;
            //this._crrY = 0;
            this._toX = 0;
            this._toY = 0;


            this.pinnedAnimationEnabled = false;
            this._pinX = 0;
            this._pinY = 0;
            this._pinAnchor = null;

        }

        /**
         * Set CIFrame object to be resized
         * @param ciframe
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.set = function (ciframe) {
            var me = this;
            me.targetFrame = ciframe;


            me.fromWidth(ciframe.getWidth());
            me.fromHeight(ciframe.getHeight());

            me.toWidth(ciframe.getWidth());
            me.toHeight(ciframe.getHeight());

            var crrPos = ciframe.getPosition();
            me.fromPosition(crrPos.x, crrPos.y, crrPos.anchor);


            return me;

        };

        /**
         * Get CIFrame object
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.get = function () {
            var me = this;
            return me.targetFrame;
        };
        /**
         * Set animation duration time millis
         * @param durationMillis
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.setDuration = function (durationMillis) {
            var me = this;
            me.durationMillis = durationMillis;
            return me;
        };

        /**
         * Set expected FPS
         * @param fps
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.setFPS = function (fps) {
            var me = this;
            me.fps = fps;
            return me;
        };

        /**
         * Set PIN position
         * @param x
         * @param y
         * @param anchor Position where animation starts from.Expected parameters as follows.
         'LEFT_TOP':Default.Specify the position starting from the upper left.
         'CENTER_TOP'
         'RIGHT_TOP'
         'LEFT_CENTER'
         'CENTER_CENTER'
         'RIGHT_CENTER'
         'LEFT_BOTTOM'
         'CENTER_BOTTOM'
         'RIGHT_BOTTOM'
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.fromPosition = function (x, y, anchor) {
            var me = this;
            me.pinnedAnimationEnabled = true;

            me._pinX = x;
            me._pinY = y;

            me.toPosition(x, y);

            if (anchor) {
                me._pinAnchor = anchor;
            }
            return me;
        };
        /**
         * Set resizeFrom width
         * @param fromWidth
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.fromWidth = function (fromWidth) {
            var me = this;
            me._crrWidth = fromWidth;

            return me;
        };

        /**
         * Set resizeFrom height
         * @param fromHeight
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.fromHeight = function (fromHeight) {
            var me = this;
            me._crrHeight = fromHeight;

            return me;
        };

        /**
         * Set resizeTo width
         * @param toWidth
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.toWidth = function (toWidth) {
            var me = this;
            me._toWidth = toWidth;

            return me;
        };

        /**
         * Set resizeTo height
         * @param toHeight
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.toHeight = function (toHeight) {
            var me = this;
            me._toHeight = toHeight;
            return me;
        };

        /**
         * Set move to position
         * @param x
         * @param y
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.toPosition = function (x, y) {
            var me = this;
            me._toX = x;
            me._toY = y;
            return me;
        };

        /**
         * Set move to x
         * @param x
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.toX = function (x) {
            var me = this;
            me._toX = x;
            return me;
        };

        /**
         * Set move to y
         * @param t
         * @returns {*}
         */
        CSimpleLayoutAnimator.prototype.toY = function (t) {
            var me = this;
            me._toY = t;
            return me;
        };


        CSimpleLayoutAnimator.prototype.start = function (waitMillis) {


            var me = this;

            var fromWidth = me._crrWidth;
            var fromHeight = me._crrHeight;

            var fromX = me._pinX;
            var fromY = me._pinY;


            return new Promise(function (resolve, reject) {


                var numOfSteps = me.fps * (me.durationMillis / 1000);

                var deltaWidth = (me._toWidth - fromWidth) / numOfSteps;
                var deltaHeight = (me._toHeight - fromHeight) / numOfSteps;

                var deltaX = (me._toX - fromX) / numOfSteps;
                var deltaY = (me._toY - fromY) / numOfSteps;


                var unitMillis = me.durationMillis / numOfSteps;

                var idx = 0;


                function loop() {
                    var timer = new CTimer();

                    timer.setIntervalMillis(unitMillis);

                    timer.setCallback(function (timer) {

                        if (idx == numOfSteps) {

                            var _width = me._toWidth;
                            var _height = me._toHeight;

                            var _x = fromX + deltaX * idx;
                            var _y = fromY + deltaY * idx;

                            if (me.pinnedAnimationEnabled) {
                                //me.targetFrame._setPositionInternally(me._pinX, me._pinY, me._pinAnchor, _width, _height);

                                me.targetFrame._setPositionInternally(_x, _y, me._pinAnchor, _width, _height);
                            }

                            me.targetFrame.resizeDirect(_width, _height);

                            me._crrWidth = _width;
                            me._crrHeight = _height;

                            me._pinX = _x;
                            me._pinY = _y;
                        }

                        if (idx == (numOfSteps + 1)) {
                            //Stop timer after last draw update.
                            timer.stopTimer();
                            resolve(me);
                            return;
                        }


                        var _width = fromWidth + deltaWidth * idx;
                        var _height = fromHeight + deltaHeight * idx;

                        var _x = fromX + deltaX * idx;
                        var _y = fromY + deltaY * idx;

                        if (me.pinnedAnimationEnabled) {
                            //me.targetFrame._setPositionInternally(me._pinX, me._pinY, me._pinAnchor, _width, _height);
                            me.targetFrame._setPositionInternally(_x, _y, me._pinAnchor, _width, _height);
                        }

                        me.targetFrame.resizeDirect(_width, _height);

                        if (idx == 0) {
                            me.targetFrame.show();
                        }

                        idx++;
                    });


                    timer.startTimer();
                }

                if (waitMillis) {

                    var waiter = new CTimer();
                    waiter.setIntervalMillis(waitMillis);
                    waiter.setCallback(function (_timer) {
                        _timer.stopTimer();

                        loop();
                    });
                    waiter.startTimer();
                } else {
                    loop();
                }


            });

        };//start

        /**
         * end of CSimpleLayoutAnimator class
         */
        //+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
        /**
         * CTimer class<br>
         * Copyright 2007- Tom Misawa, riversun.org@gmail.com
         *
         * Permission is hereby granted, free of charge, to any person obtaining a copy of
         * this software and associated documentation files (the "Software"), to deal in the
         * Software without restriction, including without limitation the rights to use,
         * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
         * Software, and to permit persons to whom the Software is furnished to do so,
         * subject to the following conditions:
         *
         * The above copyright notice and this permission notice shall be included in all
         * copies or substantial portions of the Software.
         *
         * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
         *  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
         * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
         * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
         * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
         * IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
         *
         * How to use:
         *  var timer = new CTimer();
         *    var value = 0;
         *
         *    timer.setCallback(function (timerObj) {
 *        value++;
 *        console.log(value);
 *        if (value == 100) {
 *            timerObj.stopTimer();
 *        }
 *    });
         *    timer.setIntervalMillis(100);
         *    timer.startTimer();
         *
         * @author Tom Misawa (riversun.org@gmail.com)
         */

        var CTimer =
            (function () {
                function CTimer() {
                    var me = this;

                    me._timerId = null;
                    me._isRunning = false;
                    me._timerInterval = 0;

                    me._internalCallback = _internalCallback;
                    me._timerMethod = null;


                    function _internalCallback() {
                        if (me._timerMethod) {
                            me._timerMethod(me);
                        }
                        if (me._isRunning) {
                            clearTimeout(me._timerId);
                            me._timerId = setTimeout(me._internalCallback, me._timerInterval);
                        }
                    }
                }

                CTimer.prototype.setCallback = function (callback_func) {
                    var me = this;
                    me._timerMethod = callback_func;
                    return me;
                };

                CTimer.prototype.setIntervalMillis = function (interval) {
                    var me = this;
                    me._timerInterval = interval;
                    return me;
                };

                CTimer.prototype.stopTimer = function () {
                    var me = this;
                    me._isRunning = false;
                    return me;
                };

                CTimer.prototype.startTimer = function () {
                    var me = this;
                    if (me._timerInterval > 0) {
                        me._timerId = setTimeout(me._internalCallback, me._timerInterval);
                        me._isRunning = true;

                    }
                    return me;
                };


                return CTimer;
            })();
        /**
         * end of CTimer class
         */
            //+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
        Object.freeze(DEF);

        return FrameManager;

    })();
