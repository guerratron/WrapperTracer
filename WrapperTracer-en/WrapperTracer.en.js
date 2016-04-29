/** @module WrapperTracer */

/**
  * <i style="display:none;">@namespace</i>
  * @class
  * @classdesc
  * <img src="img/WrapperTracer-logo.png" title="WrapperTracer logo" alt="logo" style="float:right;" />
  * <p>It creates a WRAPPER OBJECT that tracks the methods execution of other objects. Serves of 'TRACER'
  * to obtain a visual representation of execution cycle of the methods, as well as
  * help with information (elapsed time, nesting, types of methods, parameters, ...).
  * With only two parameters required: The 'original object' and the 'DOM container' element,
  * we obtain the 'wrapped' object and all visual inteface.
  * </p>
  * @overview
  * <pThis 'class' relies heavily on the utility functions containing another object
  * implemented in the same file, the 'UTIL' object, which contains methods and static objects
  * that, although are oriented specifically for the object 'wrapper', could
  * Used outside it following his 'classpath'.</p>
  *
  * <p>The constructor allows three parameters: </p>
  * <ul>
  *   <li>{Object} obj - The Javascript object to wrap.</li>
  *   <li>{HTMLElement|string} container - The 'HTMLElement' or your 'Element' which will serve as container for all UI.</li>
  *   <li>{Function} callback [OPTIONAL] - The function to embed in each object methods.</li>
  * </ul>
  *
  * <p>TESTED ON :: http://jsperf.com/wrapper-compare/3</p>
  * @example <caption>To Wrap a JS object.</caption>
  * //Gets the Wrapper and builds entire interface in the 'idElement' element
  * var wrapper = new WrapperTracer(objJS, 'idElement', null);
  * //Gets the wrapped
  * var wrapped = wrapper.getWrapped();
  * //Executes a method in the wrapped object to observe its tracking and tracing
  * wrapped.execBlahBlahBlah(blah, blah, blah);
  *
  * @author GuerraTron - 2015. <dinertron@gmail.com> - GPL-v3
  * @version 1.0.0b
  * @summary It is a <b>namespace</b> / <b>class</b>. This generate a <b>Wrapper</b> object to inject events in objects methods and tracking their execution cycle.
  * @namespace WrapperTracer {namespace}
  */
var WrapperTracer = (function Auto() {
    /** STATIC OBJECT WITH UTILITY METHODS BUT WITHOUT STATE
      * @summary Static object of utility. It can be obtained through its GETTER {@link WrapperTracer#getUtil()}
      * @name Util
      * @inner
      * @private
      * @memberof module:WrapperTracer
      * @property {Object} Util - The Util object
      * @property {Function} Util.wrapp - The wrapped object
      * @property {Function} Util.clone - Clone the original object
      * @property {Function} Util.inyect - Inyect events in the methods
      * @property {Function} Util.getProperties - Gets a listing with the properties
      * @property {Object} Util.LIFO - Stack which manages the routes
      * @property {Object} Util.UI - Builds the interface
      * @property {Function} Util.addClass - Adds a class to DOM element
      * @property {Function} Util.removeClass - Remove a class from DOM element
      * @property {Function} Util.toggleClass - Add/Remove a class to DOM element
      * @property {Function} Util.hasClass - Checks for a class in a DOM element
      * @property {Function} Util.addEvent - [CROSS-BROWSER] Adds a event to DOM element
      * @property {Function} Util.removeEvent - [CROSS-BROWSER] Remove a event from DOM element
      * @property {Function} Util.hasEvent - [CROSS-BROWSER] Checks for a event in a DOM element
      * @property {Function} Util.toggleDisplay - Toggle a DOM element visibility
      * @property {Function} Util.getClassName - It gets a class name based on an object
      * @property {string} Util.name - [DEBUG] Name of this object.
      */
    var Util = {
        /** STATIC :: It wraps all properties (objects, functions, strings, ...) have previously been defined in the object,
          * even if they have been defined 'undefined'. The other properties (internal or undefined) do not appear.
          * The properties are set as in the original object, respecting the own properties and those of its prototype.
          * CONCLUSION: For view undefined properties them even  would be necessary to establish them 'undefined' in
          * the original object !!.
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {Object} obj - The original object
          * @param {Function} callback - The outer callback function to inject
          * @param {Function} notify - Other inner function to inject
          * @return {Object}*/
        wrapp: function (obj, callback, notify) {
            // First clone all properties
            var wrapped = Util.clone(obj);
            // Then inject the 'Tracers' events within each method
            for (var p in obj) {
                if (typeof obj[p] === "function") {
                    wrapped[p] = Util.inject(wrapped, obj, p, callback, notify);
                }
            }
            return wrapped;
        },
        /** STATIC :: It handles clone the original object wrapped in and return it, differentiating the own methods
          * of the prototypal methods
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {Object} obj - The original object
          * @return {Object} */
        clone: function (obj) {
            /** IDENTIFICATOR */
            var id = ("WrapperTracer-" + new Date().getTime() + "-" + Math.floor((Math.random() * 10) + 1));
            //CONSTRUCTOR
            function F(id) {
                this.id = id;
            }
            var wrapped = new F(id); //new (function(){});   //reset the object
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    wrapped[p] = obj[p];
                }
                else {
                    //wrapped.__proto__[p] = obj[p];
                    F.prototype[p] = obj[p];
                }
            }
            return wrapped;
        },
        /** STATIC :: Injected into a particular method of an object the tracer event
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {Object} wrapped - The wrapped object
          * @param {Object} obj - The original object
          * @param {string} nameFunct - The method name which to inject
          * @param {Function} callback - The outer callback function to inject
          * @param {Function} notify - Other inner function to inject
          * @return {Function} */
        inject: function (wrapped, obj, nameFunct, callback, notify) {
            return function () {
                Util.LIFO.add(nameFunct); //add an element to followed path
                var timeIni = new Date().getTime(); //msg.
                var result = obj[nameFunct].apply(wrapped, arguments);
                var elapsed = new Date().getTime() - timeIni; //msg.
                if (notify) {
                    notify(elapsed, nameFunct, result, arguments);
                }
                if (callback) {
                    callback(elapsed, nameFunct, result, arguments);
                }
                Util.LIFO.del(); //removes the last element of the route to follow
                return result;
            };
        },
        /** STATIC :: Gets all the properties of the original object (strings, numbers, functions, ...) both own properties
          * as their prototype properties (as the last parameter) and constructs an object with all them separate by your
          * type (objects, functions, strings, numbers, booleans and undefined) and returns it.
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {Object} obj - The original object
          * @param {number} own - Only own properties (1), inherited (-1), or both (0).
          * @return {Object}*/
        getProperties: function (obj, own) {
            own || (own = 0);
            var arr = {
                "objects": [],
                "functions": [],
                "strings": [],
                "numbers": [],
                "booleans": [],
                "undefineds": []
            };
            for (var p in obj) {
                if (arr[(typeof obj[p]).toLowerCase() + "s"]) {
                    if ((own === 1) && obj.hasOwnProperty(p)) {
                        arr[(typeof obj[p]).toLowerCase() + "s"].push(p);
                    }
                    else if ((own === -1) && !obj.hasOwnProperty(p)) {
                        arr[(typeof obj[p]).toLowerCase() + "s"].push(p);
                    }
                    else if (own === 0) {
                        arr[(typeof obj[p]).toLowerCase() + "s"].push(p);
                    }
                }
            }
            return arr;
        },
        /** Useful object for creating deep routes or tracking, similar to LIFO stacks.
          * It contains a root element which derives (separated by SEP parameter) the different elements that we go adding. It contains 'add',
          * 'the', 'count', 'last' and 'reset' methods.
          * @memberof module:WrapperTracer.Util
          * @name LIFO
          * @inner
          * @type {Object}
          * @property {Object} LIFO - The LIFO stack
          * @property {string} LIFO.root - Root Path
          * @property {string} LIFO.path - Path to follow
          * @property {string} LIFO.SEP - Separator symbol
          * @property {Function} LIFO.add - Add element
          * @property {Function} LIFO.del - Remove element
          * @property {Function} LIFO.last - Last element
          * @property {Function} LIFO.count - Count elements
          * @property {Function} LIFO.reset - Reset to 'root'*/
        LIFO: {
            /** Root element of the path. It will allways exist */
            root: "WrapperTracer",
            /** Parameter that tracks the route to follow. */
            path: "WrapperTracer",
            /** Separator symbol for each path element. */
            SEP: ".",
            /** Sum or adding a new element to path */
            add: function (name) {
                this.path = this.path + this.SEP + name;
            },
            /** Deletes the path's last element without allowing him to remain empty */
            del: function () {
                if (this.path.split(this.SEP).length > 1) {
                    var arr = this.path.split(this.SEP);
                    arr.pop();
                    this.path = arr.join(this.SEP);
                }
            },
            /** Returns the path's last element, without modification. */
            last: function () {
                return this.path.split(this.SEP)[this.path.split(this.SEP).length - 1];
            },
            /** Count the path's parts */
            count: function () {
                return this.path.split(this.SEP).length;
            },
            /** Reset the path */
            reset: function () {
                this.path = this.root;
            }
        },
        /** Useful object for create the tracking interface of executed methods within object
          * @memberof module:WrapperTracer.Util
          * @name UI
          * @inner
          * @type {Object}
          * @property {Object} UI - The UI builder
          * @property {function} UI.fatherStylized - Apply style to parent elements
          * @property {Object} UI.propertyStylized - Apply style to properties
          * @property {Function} UI.getDepthColor - Color depending on the depth
          * @property {Function} UI.getPropertyTypeColor - Color depending on the property type
          * @property {Function} UI.getPropertyTypeNamed - Name depending on the property type
          * @property {Function} UI.getPropertyType - Number which representing the property type
          * @property {Function} UI.prepareBody - Build the UI
          * @property {Function} UI.buildPropertiesInfo - Build the information for ALL properties
          * @property {Function} UI.buildPropertyInfo - Build the information for only one property
          * @property {Function} UI.buildDOMPath - Build the DOM tree from path
          * @property {Function} UI.getLastDOMPath - Returns the last DOM element from path
          * @property {Function} UI.enhanced - [EFECTOS] Stand out the 'border property', indicating the time in milliseconds.
          * @property {Function} UI.highlight - [EFECTOS] Stand out the 'border property', indicating the HTML color.
          * @property {Function} UI.transparency - [EFECTOS] Apply the transparency (0-1). */
        UI: {
            /** Applying styles to the father of all elements representing methods executed and returns it, but stylized. It does only the first time. */
            fatherStylized: function (padre, obj, path) {
                //APPLY STYLE TO PARENT
                if ((padre)) {
                    var h6, hr, a;
                    if (padre.getElementsByTagName("h6").length > 0) {
                        h6 = padre.getElementsByTagName("h6")[0];
                        //STANDING TO FINAL FOR THE 'hr' ELEMENT
                        hr = padre.getElementsByTagName("hr")[0];
                        padre.removeChild(hr);
                        padre.appendChild(hr);
                    }
                    else {
                        h6 = document.createElement("h6");
                        padre.insertBefore(h6, padre.childNodes[0]);
                        padre.style.background = "navajoWhite";
                        padre.style.borderRadius = "8px";
                        padre.style.boxShadow = "1px 1px 2px";
                        padre.style.padding = "2px";
                        padre.style.margin = "1px";
                        padre.style.zIndex = "100";
                        padre.style.position = "relative";
                        //h6.innerHTML = path;
                        hr = document.createElement("hr");
                        hr.style.clear = "both";
                        padre.appendChild(hr);
                    }
                    Util.addClass(padre, "wrapperEventFather");
                    a = document.createElement("a");
                    a.style.margin = "2px";
                    a.innerHTML = path + ", ";
                    a.href = "#" + path; //It headed us toward the element
                    //HIGHLIGHT THE ELEMENT AND IT FIRES YOUR ASSOCIATE METHOD
                    Util.addEvent(a, "click", function fireEventElement(e) {
                        /*e.preventDefault();*/
                        var partes = a.href.split("#");
                        var el = document.getElementById(partes[partes.length - 1]);
                        if (el) {
                            Util.UI.enhanced(el, 4000); //msg. de resalte
                            var imgs = el.getElementsByTagName("img");
                            for (var i = 0; i < imgs.length; i++) {
                                if (Util.hasClass(imgs[i], "firerFunction")) {
                                    imgs[i].click();
                                    break;
                                }
                            }
                        }
                        e.stopPropagation();
                        return true;
                    });
                    //HIGHLIGHT THE ELEMENT WHILE IT IS ON THE LINK
                    Util.addEvent(a, "mouseover", function enhancedElement(e) {
                        /*e.preventDefault();*/
                        var partes = a.href.split("#");
                        var el = document.getElementById(partes[partes.length - 1]);
                        if (el) {
                            el.style.border = "2px solid yellow";
                        }
                        e.stopPropagation();
                        return true;
                    });
                    //UNHIGHLIGHT THE ELEMENT
                    Util.addEvent(a, "mouseleave", function unenhancedElement(e) {
                        /*e.preventDefault();*/
                        var partes = a.href.split("#");
                        var el = document.getElementById(partes[partes.length - 1]);
                        if (el) {
                            el.style.border = "1px solid maroon";
                        }
                        e.stopPropagation();
                        return true;
                    });
                    h6.appendChild(a);
                    // HIDE/SHOW ALL CHILDREN BY CLICKING ON THE TOTAL PARENT
                    function showHideInFather(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var hijos = padre.getElementsByTagName("div");
                        for (var i = 0; i < hijos.length; i++) {
                            Util.toggleDisplay(hijos[i]);
                        }
                        return true; //CONSUME
                    }
                    //Util.removeEvent (padre, "click", showHideInFather);
                    //Util.addEvent (padre, "click", showHideInFather);
                    padre.onclick = showHideInFather;
                }
                return padre;
            },
            /** It apply styles to the property corresponding to the last passed element. Their properties will be the time elapsed by the method executed,
              * the method name, its path, the result and the arguments consumed by the method.
              * The (original or wrapped) object is also delivered for get the reference function and use with trigger ('onclick' event).
              * Return the same DOM element in parameters, but stylized. */
            propertyStylized: function (p, obj, elapsed, nameFunct, path, result, args) {
                if (p) {
                    var params = [].slice.call(args).toString();
                    p.id = path;
                    p.setAttribute("name", path);
                    Util.addClass(p, "wrapperEventFunction");
                    p.style.background = Util.UI.getDepthColor(path, null); //"darkOrange"; //[220, 100, 75]
                    p.style.border = "1px solid maroon";
                    p.style.borderRadius = "8px";
                    p.style.boxShadow = "1px 1px 2px";
                    //p.style.width = "10px";
                    p.style.padding = "2px";
                    p.style.margin = "1px";
                    p.style.cursor = "pointer";
                    p.style.cssFloat = "left";
                    p.style.fontSize = "x-small";
                    p.style.zIndex = (100 + path.split(Util.LIFO.SEP).length) + "";
                    p.style.position = "relative";
                    p.style.display = "block";
                    //INFORMATION OF METHOD
                    var ul = document.createElement("ul");
                    var li1 = document.createElement("li");
                    li1.innerHTML = "PATH:: " + path;
                    var li2 = document.createElement("li");
                    li2.innerHTML = "ELAPSED:: " + elapsed;
                    var li3 = document.createElement("li");
                    li3.innerHTML = "RESULT:: " + result;
                    ul.appendChild(li1);
                    ul.appendChild(li2);
                    ul.appendChild(li3);
                    p.insertBefore(ul, p.childNodes[0]);
                    //FUNCTION NAME AND PARAMETERS
                    var parr = document.createElement("p");
                    parr.style.color = "maroon";
                    parr.style.fontSize = "larger";
                    parr.innerHTML = nameFunct + " ( " + params + " ) ";
                    p.insertBefore(parr, p.childNodes[0]);
                    //METHOD TYPE AND TRIGGER
                    var menu = document.createElement("p");
                    menu.className = "ctrMethod";
                    menu.style.background = "lightYellow";
                    menu.style.color = "white";
                    menu.style.padding = "1px";
                    menu.style.borderRadius = "2px";
                    menu.style.position = "absolute";
                    menu.style.right = "0";
                    menu.style.fontSize = "smaller";
                    p.insertBefore(menu, p.childNodes[0]);
                    var spanType = document.createElement("span");
                    spanType.className = "infoMethod";
                    spanType.style.background = Util.UI.getPropertyTypeColor(obj, nameFunct);
                    spanType.style.color = "white";
                    spanType.style.padding = "4px";
                    spanType.style.margin = "1px";
                    spanType.style.borderRadius = "4px";
                    spanType.style.boxShadow = "1px 1px 2px";
                    spanType.style.cssFloat = "left";
                    spanType.title = Util.UI.getPropertyTypeNamed(obj, nameFunct);
                    spanType.innerHTML = spanType.title.substr(0, 1) + "<sub>" + Util.UI.getPropertyType(obj, nameFunct) + "</sub>";
                    menu.appendChild(spanType);
                    //FIRER element of method
                    var firer = document.createElement("img");
                    //IMG BASE64 RAYO  : data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAgMAAABinRfyAAAACVBMVEVHAGiSXx700VSdCvDNAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQffDAMWDTUDTyMZAAAARElEQVQI12NgYNBawcDAsHIBkFjWwMDANAvI4MoAEpogITWgEMOqZQsYmFYtA7IYZgAxUwKQ4ARJaICEJoCEQDwOIAYAKIgLxkkVELUAAAAASUVORK5CYII=
                    //IMG BASE64 DARTBOARD : data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAFVBMVEVvcm0BAQD7AAD0BQHzBgLYHwn7/Bog997YAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQffDAMWDQfLmHKZAAAAVElEQVQI12NgQALBphDaSUlJBUQzKSkKKSmABYAMkJCSUqKYkhIDA6uSWqJYklIAA7OSmqJQkpIBggGUSlIDSQEVp6WBFIPMg5jIBGIoIFuBsBQCALW2DWubFikRAAAAAElFTkSuQmCC
                    //IMG BASE64 DARTBOARD2: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMBAMAAACkW0HUAAAAFVBMVEX/jYvEAAL0AAC2Hx1CSVDKtLL8//uFUdIFAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAAFxIAABcSAWef0lIAAAAHdElNRQffCwcRBRS/8uSNAAAAMUlEQVQI12NggAEXFwgJpl3c0lwcGFhc0sCUW5JiCogKEgRTycJACqoEpoHFBcSBAADyqwwbcf9r5QAAAABJRU5ErkJggg=="
                    firer.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMBAMAAACkW0HUAAAAFVBM" +
                        "VEX/jYvEAAL0AAC2Hx1CSVDKtLL8//uFUdIFAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAA" +
                        "JcEhZcwAAFxIAABcSAWef0lIAAAAHdElNRQffCwcRBRS/8uSNAAAAMUlEQVQI12NggAEXFwgJpl" +
                        "3c0lwcGFhc0sCUW5JiCogKEgRTycJACqoEpoHFBcSBAADyqwwbcf9r5QAAAABJRU5ErkJggg==";
                    firer.className = "firerFunction";
                    firer.style.cssFloat = "left";
                    firer.style.width = "16px";
                    firer.style.cursor = "pointer";
                    firer.style.border = "1px dashed maroon";
                    //firer.innerHTML = "&odot;";
                    firer.title = (obj && obj[nameFunct]) ? obj[nameFunct].toString() : "???";
                    menu.appendChild(firer);
                    /*
                    var circle=document.createElement("span");
                    circle.style.color="red";
                    circle.style.fontSize="x-large";
                    circle.style.fontWeight="bolder";
                    circle.innerHTML = "&ofcir;"; //"&ocir;"; //"&odot;";
                    menu.appendChild(circle);*/
                    //FIRER EVENTS
                    Util.addEvent(firer, "mouseenter", function borderShow(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        firer.style.border = "2px dashed red";
                        return true;
                    });
                    Util.addEvent(firer, "mouseleave", function borderHide(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        firer.style.border = "1px ridge maroon";
                        return true;
                    });
                    //PASS THE ARGUMENTS BY CLICKING ON THE FUNCTION
                    Util.addEvent(firer, "click", function execFunction(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (obj && obj[nameFunct]) {
                            obj[nameFunct].apply(obj, args);
                        }
                        return true;
                    });
                    //ELEMENT EVENTS
                    Util.addEvent(p, "click", function eventNull(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return true;
                    });
                    Util.addEvent(p, "mouseenter", function borderShow(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        p.style.border = "2px ridge red";
                        return true;
                    });
                    Util.addEvent(p, "mouseleave", function borderHide(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        p.style.border = "1px ridge maroon";
                        return true;
                    });
                    //SHOW/HIDE ALL 'DIV' CHILDREN  OF ELEMENT, IF HAS IT
                    function showHideInSon(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        for (var i = 0; i < hijos.length; i++) {
                            if (Util.hasClass(hijos[i], "wrapperEventFunction")) {
                                Util.toggleDisplay(hijos[i]);
                            }
                        }
                        return true;
                    }
                    var hijos = p.getElementsByTagName("div");
                    if ((hijos.length > 0)) {
                        Util.removeEvent(p, "click", showHideInSon);
                        Util.addEvent(p, "click", showHideInSon);
                    }
                }
                return p;
            },
            /** Returns an HTML color based on the depth of your path. Allows some initial RGB colors ([red, green, blue]) */
            getDepthColor: function (path, rgb) {
                rgb || (rgb = [220, 125, 25]);
                var depth = path.split(Util.LIFO.SEP).length * 25;
                return ("RGB(" + parseInt((rgb[0] + depth / 8) + "") + ", " +
                    parseInt((rgb[1] + depth / 2) + "") + ", " +
                    parseInt((rgb[2] + depth) + "") + ")");
            },
            /** Returns an HTML color based on the property type (function, object, string, ...) and inheritance.
              * It can also be obtained if indicating the color index (the other parameters are ignored).
              * Internally uses the 'getPropertyType' method */
            getPropertyTypeColor: function (obj, prop, index) {
                if (index === void 0) { index = undefined; }
                if (isNaN(index))
                    index = Util.UI.getPropertyType(obj, prop);
                switch (index) {
                    //FUNCTION
                    case 0: return "chartreuse"; //"function OWN"
                    case 1: return "limeGreen"; //"function INHERITED"
                    //OBJECT
                    case 2: return "mediumPurple"; //"object OWN"
                    case 3: return "blueViolet"; //"object INHERITED"
                    //ARRAY
                    case 4: return "khaki"; //"array OWN"
                    case 5: return "darkKhaki"; //"array INHERITED"
                    //STRING
                    case 6: return "navajoWhite"; //"string OWN"
                    case 7: return "coral"; //"string INHERITED"
                    //NUMBER
                    case 8: return "skyBlue "; //"number OWN"
                    case 9: return "steelBlue"; //"number INHERITED"
                    //BOOLEAN
                    case 10: return "cadetBlue"; //"boolean OWN"
                    case 11: return "Turquoise"; //"boolean INHERITED"
                    //UNDEFINED
                    case 12: return "#AAAAAA"; //"undefined OWN"
                    case 13: return "#666666"; //"undefined INHERITED"
                    //NULL
                    case 14: return "dimGray"; //"null OWN"
                    case 15: return "darkSlateGray"; //"null INHERITED"
                    //UNKNOW
                    case 16: return "darkGray"; //"desconocida OWN"
                    case 17: return "lightGray"; //"desconocida INHERITED"
                    //NON-EXISTENT
                    default: return "#333333"; //INEXISTENTE
                }
                return "#555555";
            },
            /** Returns a name based on the type of property (function, object, string, ...) and heritage.
              * You can also obtained the name indicating its index (the other parameters are ignored).
              * Internally uses the 'getPropertyType' method */
            getPropertyTypeNamed: function (obj, prop, index) {
                if (index === void 0) { index = undefined; }
                if (isNaN(index))
                    index = Util.UI.getPropertyType(obj, prop);
                switch (index) {
                    //FUNCTION
                    case 0: return "function OWN";
                    case 1: return "function INHERITED";
                    //OBJECT
                    case 2: return "object OWN";
                    case 3: return "object INHERITED";
                    //ARRAY
                    case 4: return "array OWN";
                    case 5: return "array INHERITED";
                    //STRING
                    case 6: return "string OWN";
                    case 7: return "string INHERITED";
                    //NUMBER
                    case 8: return "number OWN";
                    case 9: return "number INHERITED";
                    //BOOLEAN
                    case 10: return "boolean OWN";
                    case 11: return "boolean INHERITED";
                    //UNDEFINED
                    case 12: return "undefined OWN";
                    case 13: return "undefined INHERITED";
                    //NULL
                    case 14: return "null OWN";
                    case 15: return "null INHERITED";
                    //UNKNOW
                    case 16: return "unknown OWN";
                    case 17: return "unknown INHERITED";
                    //NON-EXISTENT
                    default: return "NON-EXISTENT";
                }
                return "NON-EXISTENT";
            },
            /** Returns the property type (function, object, string, ...) taking into account its inheritance. */
            getPropertyType: function (obj, prop) {
                if (obj) {
                    var own = obj.hasOwnProperty(prop); //check if the property is own or inherited.
                    switch ((typeof obj[prop]).toLowerCase()) {
                        case "function": return (own ? 0 : 1); //"green" : "lightGreen");
                        case "object": return (obj[prop] instanceof Array) ? (own ? 4 : 5) : ((obj[prop] === null) ? (own ? 14 : 15) : (own ? 2 : 3)); //"yellow" : "lightYellow");//"lime" : "lemmon");
                        case "array": return (own ? 4 : 5); //"lime" : "lemmon");
                        case "string": return (own ? 6 : 7); //"coral" : "navajoWhite");
                        case "number": return (own ? 8 : 9); //"blue" : "aquamarine");
                        case "boolean": return (own ? 10 : 11); //"blue" : "aquamarine");
                        case "undefined": return (obj[prop] === null) ? (own ? 14 : 15) : (own ? 12 : 13); //"blue" : "aquamarine");
                        case "null": return (own ? 14 : 15); //"blue" : "aquamarine");
                        default: return (own ? 16 : 17); //"darkGray" : "lightGray");
                    }
                }
                return 20; //UNKNOWN
            },
            /** Build and apply styles to the UI. There needs the container element (supports its id).
              * @return Returns the DOM element (HTMLDivElement) */
            prepareBody: function (container) {
                //::prepareBody::
                if (container) {
                    //Checks whether it has cast a string
                    try {
                        if (typeof container === "string") {
                            container = document.getElementById(container + "");
                        }
                        container.id = container.id; //It causes an exception if doesn't exists the container
                    }
                    catch (e) {
                        return container;
                    }
                    var h3 = document.createElement("h3");
                    h3.style.textDecoration = "underline";
                    h3.style.margin = "auto";
                    h3.style.textShadow = "1px 1px whiteSmoke";
                    h3.appendChild(document.createTextNode("WRAPPER-TRACER:"));
                    container.appendChild(h3);
                    var hr;
                    var wrapperInfo = document.createElement("div");
                    wrapperInfo.id = "wrapperInfo";
                    wrapperInfo.className = "wrapperInfo";
                    wrapperInfo.style.background = "lightGray";
                    wrapperInfo.style.borderRadius = "6px";
                    wrapperInfo.style.boxShadow = "4px 4px 6px";
                    wrapperInfo.style.width = "99%";
                    wrapperInfo.style.padding = "4px";
                    wrapperInfo.style.margin = "1px";
                    //TITLE
                    var h4 = document.createElement("h4");
                    h4.id = "wrapperInfo-title";
                    h4.innerHTML = "OBJECT SKELETON: ";
                    h4.style.cssFloat = "left";
                    h4.style.margin = "2px";
                    h4.style.maxWidth = "50%";
                    wrapperInfo.appendChild(h4);
                    hr = document.createElement("hr");
                    hr.style.clear = "both";
                    hr.style.marginBottom = "0";
                    wrapperInfo.appendChild(hr);
                    container.appendChild(wrapperInfo);
                    hr = document.createElement("hr");
                    hr.style.clear = "both";
                    container.appendChild(hr);
                    var wrapperEvents = document.createElement("div");
                    wrapperEvents.id = "wrapperEvents";
                    wrapperEvents.style.background = "lightYellow";
                    wrapperEvents.style.borderRadius = "6px";
                    wrapperEvents.style.boxShadow = "4px 4px 6px";
                    wrapperEvents.style.width = "99%";
                    wrapperEvents.style.padding = "4px";
                    wrapperEvents.style.margin = "1px";
                    wrapperEvents.style.clear = "both";
                    wrapperEvents.innerHTML = "OBJECT TRAITS:";
                    hr = document.createElement("hr");
                    hr.style.clear = "both";
                    wrapperEvents.appendChild(hr);
                    container.appendChild(wrapperEvents);
                    hr = document.createElement("hr");
                    hr.style.clear = "both";
                    hr.style.marginBottom = "0";
                    container.appendChild(hr);
                }
                return container;
            },
            /** Build all information relating to all methods and properties of the object, used or not, showing relevant information such as type of
              * property and its value.
              * It call internally to Util.UI.buildPropertyInfo (...) */
            buildPropertiesInfo: function (container, obj) {
                //::buildPropertiesInfo::
                if (container && obj) {
                    //WRAPPER TITLE
                    var tituloWrapper = container.parentNode.firstChild; //the title already existed in a Heading h4 element
                    tituloWrapper.textContent += " '" + Util.getClassName(obj) + "' [" + typeof obj + "]";
                    //PROPERTIES CONTAINER
                    var divP = document.createElement("div");
                    divP.className = "wrapperProperties";
                    divP.style.clear = "both";
                    container.appendChild(divP);
                    //HIDE THE PROPERTIES
                    var spanVer = document.createElement("span");
                    spanVer.className = "viewEnabled";
                    spanVer.style.fontSize = "smaller";
                    spanVer.style.cssFloat = "left";
                    spanVer.style.textShadow = "1px 1px whiteSmoke";
                    spanVer.style.cursor = "pointer";
                    spanVer.style.padding = "2px";
                    spanVer.style.border = "4px ridge gray";
                    spanVer.style.borderRadius = "6px";
                    spanVer.style.boxShadow = "2px 2px 4px";
                    spanVer.title = "PROPERTIES (VIEW / HIDDEN)";
                    spanVer.onclick = function toggleFunction() {
                        if (spanVer.className === "viewEnabled") {
                            divP.style.display = "none";
                            spanVer.className = "viewDisabled";
                        }
                        else {
                            divP.style.display = "block";
                            spanVer.className = "viewEnabled";
                        }
                    };
                    spanVer.onmouseover = function hoverStyle() { spanVer.style.opacity = "0.8"; };
                    spanVer.onmouseout = function inhoverStyle() { spanVer.style.opacity = "1"; };
                    /*var plusMinus=document.createElement("span");
                    plusMinus.innerHTML="&ominus;&oplus;";*/
                    spanVer.appendChild(document.createTextNode("+/-")); //document.createTextNode("+/-") //plusMinus
                    container.insertBefore(spanVer, container.firstChild.nextSibling); // appendChild(spanVer);
                    var divInfo = document.createElement("div");
                    divInfo.className = "wrapperProperties-infoColors";
                    divInfo.style.fontSize = "x-small";
                    divInfo.style.cssFloat = "right";
                    divInfo.style.textShadow = "1px 1px whiteSmoke";
                    divInfo.style.padding = "2px";
                    divInfo.style.border = "1px solid gray";
                    divInfo.style.borderRadius = "6px";
                    divInfo.style.textAlign = "center";
                    divInfo.style.boxShadow = "2px 2px 4px";
                    divInfo.style.background = "whiteSmoke";
                    divInfo.innerHTML = "<-?:";
                    container.insertBefore(divInfo, container.firstChild.nextSibling);
                    for (var i = 0; i <= 18; i++) {
                        var infoColor = document.createElement("div");
                        infoColor.innerHTML = i + "";
                        infoColor.title = Util.UI.getPropertyTypeNamed(null, null, i);
                        infoColor.style.background = Util.UI.getPropertyTypeColor(null, null, i);
                        infoColor.style.borderRadius = "4px";
                        infoColor.style.width = "14px";
                        infoColor.style.height = "14px";
                        infoColor.style.padding = "0";
                        infoColor.style.margin = "1px";
                        infoColor.style.cssFloat = "left";
                        infoColor.style.cursor = "pointer";
                        infoColor.style.opacity = "1";
                        Util.UI.transparency(infoColor, 0.7);
                        divInfo.appendChild(infoColor);
                    }
                    //PROPERTIES SEPARATORS (NUMBER, STRINGS, OBJECTS, ARRAYS Y FUNCIONES)
                    var id = obj["id"] || parseInt((((Math.random() + 1) * 1000) / 10) + ""); //del 1 al 100
                    var pNumberString = document.createElement("div");
                    pNumberString.className = "wrapperPropertiesNumbers";
                    pNumberString.id = "wrapperPropertiesNumbers-" + id;
                    pNumberString.style.cssFloat = "left";
                    pNumberString.style.maxWidth = "18%";
                    pNumberString.style.border = "2px ridge maroon";
                    pNumberString.style.borderRadius = "8px";
                    pNumberString.style.textAlign = "center";
                    var h5 = document.createElement("h5");
                    h5.style.textDecoration = "underline";
                    h5.style.margin = "auto";
                    h5.style.textShadow = "1px 1px whiteSmoke";
                    h5.appendChild(document.createTextNode("NUMBERS, STRINGS, ..."));
                    pNumberString.appendChild(h5);
                    divP.appendChild(pNumberString);
                    var pObjectArray = document.createElement("div");
                    pObjectArray.className = "wrapperPropertiesObjects";
                    pObjectArray.style.cssFloat = "left";
                    pObjectArray.style.maxWidth = "18%";
                    pObjectArray.style.border = "2px ridge maroon";
                    pObjectArray.style.borderRadius = "8px";
                    pObjectArray.style.textAlign = "center";
                    h5 = document.createElement("h5");
                    h5.style.textDecoration = "underline";
                    h5.style.margin = "auto";
                    h5.style.textShadow = "1px 1px whiteSmoke";
                    h5.appendChild(document.createTextNode("OBJECTS, ARRAYS, ..."));
                    pObjectArray.appendChild(h5);
                    divP.appendChild(pObjectArray);
                    var pFunction = document.createElement("div");
                    pFunction.className = "wrapperPropertiesFunctions";
                    pFunction.style.cssFloat = "left";
                    pFunction.style.maxWidth = "58%";
                    pFunction.style.border = "2px ridge maroon";
                    pFunction.style.borderRadius = "8px";
                    pFunction.style.textAlign = "center";
                    //pFunction.style.overflow="auto";
                    h5 = document.createElement("h5");
                    h5.style.textDecoration = "underline";
                    h5.style.margin = "auto";
                    h5.style.textShadow = "1px 1px whiteSmoke";
                    h5.appendChild(document.createTextNode("FUNCTIONS, ..."));
                    pFunction.appendChild(h5);
                    divP.appendChild(pFunction);
                    /** Internal object for organize the methods types */
                    var objElements = {
                        "pNumberString": pNumberString,
                        "pObjectArray": pObjectArray,
                        "pFunction": pFunction
                    };
                    for (var s in obj) {
                        Util.UI.buildPropertyInfo(container, obj, s, objElements);
                    }
                    var br = document.createElement("br");
                    br.style.clear = "both";
                    container.appendChild(br);
                }
                return container;
            },
            /** Build information relating to a property of the object, is used or not, showing relevant information such as type of property and its value.
              * The '<b>objElements</b>' parameter contain the 'divs' elements that will house all methods and properties depending on their type.
              * This sirve to organize the used methods and is intended primarily for harboring at least the following structure:
              * <pre>
              * var objElements = {
              *   "pNumberString" : pNumberString,
              *   "pObjectArray" : pObjectArray,
              *   "pFunction" : pFunction
              * }
              * </pre> */
            buildPropertyInfo: function (container, obj, s, objElements) {
                if (container && obj) {
                    //PROPERTY
                    var divElements = null;
                    var p = document.createElement("div");
                    var own = obj.hasOwnProperty(s);
                    var iconTypeTxt = "?";
                    var iconTypeColor = "white"; //in the type-color is stored the color that is even to the method
                    p.className = "wrapperProperty-Info";
                    p.style.background = Util.UI.getPropertyTypeColor(obj, s);
                    switch (Util.UI.getPropertyType(obj, s)) {
                        case 0:
                        case 1:
                            divElements = objElements["pFunction"];
                            iconTypeTxt = "&conint;"; //"f";
                            iconTypeColor = (own ? "limeGreen" : "chartreuse");
                            break;
                        case 2:
                        case 3:
                            divElements = objElements["pObjectArray"];
                            iconTypeTxt = "&star;"; //"&blk14;"; //"&therefore;"; //"&Colon;"; //"{}";
                            iconTypeColor = (own ? "blueViolet" : "mediumPurple");
                            break;
                        case 4:
                        case 5:
                            divElements = objElements["pObjectArray"];
                            iconTypeTxt = "&therefore;"; //"&ratio;"; //"&vellip;"; //"&ctdot;"; //"[ ]";
                            iconTypeColor = (own ? "darkKhaki" : "khaki");
                            break;
                        case 6:
                        case 7:
                            divElements = objElements["pNumberString"];
                            iconTypeTxt = "&aelig;"; //"&Sopf;"; //"ab";
                            iconTypeColor = (own ? "coral" : "navajoWhite");
                            break;
                        case 8:
                        case 9:
                            divElements = objElements["pNumberString"];
                            iconTypeTxt = "&naturals;"; //"12";
                            iconTypeColor = (own ? "steelBlue" : "skyBlue");
                            break;
                        case 10:
                        case 11:
                            divElements = objElements["pNumberString"];
                            iconTypeTxt = "&origof;"; //"&ovbar;"; //"&origof;"; //"01";
                            iconTypeColor = (own ? "Turquoise" : "cadetBlue");
                            break;
                        case 12:
                        case 13:
                            divElements = objElements["pNumberString"];
                            iconTypeTxt = "!";
                            iconTypeColor = (own ? "#666666" : "#AAAAAA");
                            break;
                        case 14:
                        case 15:
                            divElements = objElements["pNumberString"];
                            iconTypeTxt = "&empty;"; //"&theta;"; //"&Theta;";
                            iconTypeColor = (own ? "darkSlateGray" : "dimGray");
                            break;
                        default:
                            divElements = objElements["pFunction"];
                            iconTypeTxt = "?";
                            iconTypeColor = (own ? "lightGray" : "darkGray");
                    }
                    p.style.borderRadius = "6px";
                    p.style.boxShadow = "2px 2px 3px";
                    p.style.padding = "2px";
                    p.style.margin = "1px";
                    p.style.cssFloat = "left";
                    p.style.maxWidth = "98%";
                    p.style.maxHeight = "75px";
                    p.style.overflow = "auto";
                    p.onmouseover = function hoverStyle() { p.style.opacity = "0.8"; };
                    p.onmouseout = function inhoverStyle() { p.style.opacity = "1"; };
                    //PROPERTY TITLE
                    var title = document.createElement("h3");
                    title.className = "wrapperTitleProperty";
                    title.style.display = "inline";
                    title.title = "Property type: [" + (typeof obj[s]) + "]";
                    title.appendChild(document.createTextNode(" = " + s + " = "));
                    //PROPERTY BODY
                    var body = document.createElement("div");
                    body.className = "wrapperBodyProperty";
                    body.style.background = (own ? "white" : "whiteSmoke");
                    body.style.borderRadius = "2px";
                    body.style.boxShadow = "2px 2px 3px";
                    body.style.padding = "2px";
                    body.style.margin = "1px";
                    if (obj[s])
                        body.title = obj[s].toString();
                    var txt2 = document.createTextNode(obj[s]);
                    body.appendChild(txt2);
                    //ICON
                    var iconTxt = document.createElement("span");
                    iconTxt.innerHTML = iconTypeTxt;
                    iconTxt.style.padding = "2px";
                    iconTxt.style.background = iconTypeColor;
                    iconTxt.style.borderRadius = "2px";
                    iconTxt.style.cssFloat = "right";
                    iconTxt.style.width = "16px";
                    iconTxt.style.textShadow = "1px 1px whiteSmoke";
                    iconTxt.title = Util.UI.getPropertyTypeNamed(obj, s) + " [" + (own ? "Own" : "Inherited") + "]";
                    iconTxt.style.cursor = "pointer";
                    p.appendChild(title);
                    p.appendChild(iconTxt);
                    p.appendChild(body);
                    divElements.appendChild(p);
                }
                return container;
            },
            /** WARNIGN:: RECURSIVE FUNCTION::
              * Build the DOM tree specified by the route in the container element indicated, and returns the element Father of them all.
              * The route normally be in 'point' format: one.two.three */
            buildDOMPath: function buildDOMPath(pContainer, path) {
                var p;
                if (pContainer) {
                    var partes = path.split(Util.LIFO.SEP);
                    var path2 = partes[0];
                    try {
                        var pp = pContainer.getElementsByTagName("div");
                        for (var j = 0; j < pp.length; j++) {
                            var ruta = pp[j].id.split(Util.LIFO.SEP);
                            if (ruta[ruta.length - 1] === path2) {
                                p = pp[j];
                            }
                        }
                        p.id = p.id; //if doesn't exists the element, it will throw an exception
                    }
                    catch (e) {
                        p = document.createElement("div");
                        p.id = path2;
                        pContainer.appendChild(p);
                    }
                    //IF IT HAS MORE THAN ONE PART, THEN RECURSIVITY
                    if (partes.length > 1) {
                        var ppp = buildDOMPath(p, partes.slice(1).join(Util.LIFO.SEP));
                        if (ppp) {
                            p.appendChild(ppp);
                        }
                    }
                }
                return p;
            },
            /** Returns a reference to the last DOM element of the path. The element must exist in the DOM tree. */
            getLastDOMPath: function (pContainer, path) {
                var p;
                if (pContainer) {
                    var partes = path.split(Util.LIFO.SEP);
                    for (var i = 1; i < partes.length; i++) {
                        var path2 = partes[i];
                        try {
                            var pp = pContainer.getElementsByTagName("div");
                            for (var j = 0; j < pp.length; j++) {
                                if (pp[j].id === path2) {
                                    p = pp[j];
                                }
                            }
                            p.id = p.id; //if doesn't exists the element, it will throw an exception
                            pContainer = p;
                        }
                        catch (e) {
                            p = null;
                            break; //Exit from 'For' structure with a NULL element. It doesn't has created within DOM yet.
                        }
                    }
                }
                return p;
            },
            /** Highlight the element based on its 'border' style property. Specify the highlighted time (in milliseconds.)
              * The 'Util' object is returned to allow 'chaining' */
            enhanced: function (el, time) {
                if (time === void 0) { time = 2000; }
                if (el) {
                    time || (time = 2000); //2 sg. por defecto
                    var oldBorde = el.style.border;
                    var oldDisplay = el.style.display;
                    el.style.display = "block";
                    el.style.border = "2px solid yellow";
                    window.setTimeout(function () {
                        el.style.display = oldDisplay;
                        el.style.border = oldBorde;
                    }, time);
                }
                return this;
            },
            /** Highlight the element based on its 'border' style property. Allows specify the highlighted color.
              * The 'Util' object is returned to allow 'chaining' */
            highlight: function (el, color) {
                if (color === void 0) { color = "yellow"; }
                if (el) {
                    color || (color = "yellow");
                    var oldBorde = el.style.border;
                    var oldDisplay = el.style.display;
                    Util.addEvent(el, "mouseover", function showHighlight(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        el.style.display = "block";
                        el.style.border = "1px solid " + color;
                        return true;
                    });
                    Util.addEvent(el, "mouseleave", function hideHighlight(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        el.style.display = oldDisplay;
                        el.style.border = oldBorde;
                        return true;
                    });
                }
                return this;
            },
            /** Highlight the element based on its 'opacity' style property. Allows specify the transparency level (0-1).
              * The 'Util' object is returned to allow 'chaining' */
            transparency: function (el, level) {
                if (level === void 0) { level = 0.8; }
                if (el) {
                    level || (level = 0.8);
                    var old = el.style.opacity;
                    Util.addEvent(el, "mouseover", function showTransparency(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        el.style.opacity = level + "";
                        return true;
                    });
                    Util.addEvent(el, "mouseleave", function hideTransparency(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        el.style.opacity = old;
                        return true;
                    });
                }
                return this;
            }
        },
        /** Add a class to an element (if not previously existed). It uses the modern property 'classList'; should support it, but if not, applies a 'shim-code'.
          * The 'Util' object is returned to allow 'chaining'
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {HTMLElement} elem - DOM element
          * @param {string} className - The class to insert
          * @return {Object:this} */
        addClass: function (elem, className) {
            if (elem.classList) {
                elem.classList.add(className);
            }
            else {
                if (elem.className.indexOf(className) === -1) {
                    //elem.className = elem.className + " " + className;
                    var clases = elem.className.split(" ");
                    clases.push(className);
                    elem.className = clases.join(" ");
                }
            }
            return this;
        },
        /** Remove a class from an element (if not previously existed). It uses the modern property 'classList'; should support it, but if not, applies a 'shim-code'.
          * The 'Util' object is returned to allow 'chaining'
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {HTMLElement} elem - DOM element
          * @param {string} className - The class to remove
          * @return {Object:this} */
        removeClass: function (elem, className) {
            if (elem.classList) {
                elem.classList.remove(className);
            }
            else {
                if (elem.className.indexOf(className) > -1) {
                    var clases = elem.className.split(" ");
                    var index = clases.indexOf(className);
                    clases.splice(index, 1);
                    elem.className = clases.join(" ");
                }
            }
            return this;
        },
        /** Switch a class from an element (if not previously existed). It uses the modern property 'classList'; should support it, but if not, applies a 'shim-code'.
          * The 'Util' object is returned to allow 'chaining'
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {HTMLElement} elem - DOM element
          * @param {string} className - The class to toggle
          * @return {Object:this}  */
        toggleClass: function myFunction(elem, className) {
            if (elem.classList) {
                elem.classList.toggle(className);
            }
            else {
                if (elem.className.indexOf(className) > -1) {
                    Util.removeClass(elem, className);
                }
                else {
                    Util.addClass(elem, className);
                }
            }
            return this;
        },
        /** This checks if the element contains the specified class. It uses the modern property 'classList'; should support it, but if not, applies a 'shim-code'.
          * @return boolean
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {HTMLElement} elem - DOM element
          * @param {string} className - The class to check
          * @return {Object:this} */
        hasClass: function myFunction(elem, className) {
            if (elem.classList) {
                return elem.classList.contains(className);
            }
            return (elem.className.indexOf(className) > -1);
        },
        /** EVENTS COMPATIBILIZER
          * where 'a' is the item you want to set the listening, 'enventType' is a string (no prefix 'on') and 'handler' is a function to run.
          * The 'Util' object is returned to allow 'chaining'
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {HTMLElement} elem - DOM element
          * @param {string} eventType - The event type ('click', 'mouseover', 'mouseout', ...)
          * @param {Function} handler - Function to execute for event
          * @return {Object:this} */
        addEvent: function (elem, eventType, handler) {
            if (elem.addEventListener) {
                elem.addEventListener(eventType, handler, false);
            }
            else if (elem.attachEvent) {
                elem.attachEvent('on' + eventType, handler);
            }
            return this;
        },
        /** EVENTS COMPATIBILIZER
          * where 'elem' is the item which to unset the listening, 'enventType' is a string (no prefix 'on') and 'handler' is a function to remove.
          * The 'Util' object is returned to allow 'chaining'
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {HTMLElement} elem - DOM element
          * @param {string} eventType - The event type ('click', 'mouseover', 'mouseout', ...)
          * @param {Function} handler - Function to remove withing event
          * @return {Object:this} */
        removeEvent: function (elem, eventType, handler) {
            elem[eventType] = null;
            if (elem.removeEventListener) {
                elem.removeEventListener(eventType, handler, false);
            }
            else if (elem.detachEvent) {
                elem.detachEvent('on' + eventType, handler);
            }
            return this;
        },
        /** EVENTS COMPATIBILIZER
          * where 'elem' is the item that is to determine if the event exists and 'enventType' is a string (no prefix 'on') to verify its existence.
          * @return boolean
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {HTMLElement} elem - DOM element
          * @param {string} eventType - The event type ('click', 'mouseover', 'mouseout', ...)
          * @return {boolean} */
        hasEvent: function (elem, eventType) {
            eventType = (elem.attachEvent) ? "on" + eventType : eventType;
            var comprobacion1 = (typeof elem[eventType] == "function");
            var comprobacion2 = (elem[eventType] !== undefined);
            var comprobacion3 = elem.hasOwnProperty(eventType);
            return comprobacion1 || comprobacion2;
        },
        /** Switch the element visibility (if it showing then hide it, else not) based in your 'display' style property.
          * The 'Util' object is returned to allow 'chaining'
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {HTMLElement} elem - DOM element
          * @return {Object:this} */
        toggleDisplay: function (elem) {
            if (elem.style.display === "block") {
                elem.style.display = "none";
            }
            else {
                elem.style.display = "block";
            }
            return this;
        },
        /** Extract the class name which owns the actual object.
          * @memberof module:WrapperTracer.Util
          * @type {Function}
          * @param {Object} obj - JS object to get a proper class name
          * @return {string} */
        getClassName: function (obj) {
            return (obj && obj.constructor) ? ("" + obj.constructor).split("function ")[1].split("(")[0].trim() : "[NONE]";
        },
        /** Just for debugging purposes
          * @memberof module:WrapperTracer.Util
          * @type {string} */
        name: "Util"
    }; //END UTIL
    
    /** IDENTIFICATOR
      * @private
      * @type {string}
      * @default none */
    var _id; //= "WrapperTracer-"+new Date().getTime +"-"+ Math.floor((Math.random()*10)+1);
    /** Original Object
      * @private
      * @type {Object:Javascript}
      * @default none */
    var _target; //ORIGINAL OBJECT, DON'T MODIFIED
    /** Wrapped Objeto
      * @private
      * @type {Object:WrapperTracer#Wrapped}
      * @default none */
    var _wrapped; //WRAPPED OBJECT
    /** Grouping Properties (string, numbers, functions, objects, ...) in an Object, both own properties and private.
      * @private
      * @type {Object}
      * @default empty {} */
    var _props = {}; //OBJECT OF ARRAYs
    /** Collection of information objects for each executed method, where informations are displayed as the consumed time, the operation result,
      * the different parameters passed, ...
      * @private
      * @type {Object}
      * @default empty {} */
    var _info = {};
    /** External function to insert the object 'wrapped' within each method. [OPTIONAL]
      * You will pass as parameters the time spent by the method (in msg.), the method name to run, the result of this method and parameters that
      * need the method. Allows externally interact with the API, it is a way to extend its possibilities.
      * @private
      * @type {Function}
      * @default none
      * @return {void|number|boolean|string|object} anything */
    var _callback;
    /** Internal function to insert the object 'wrapped' within each method, to follow a trail of its activity.
      * You will pass as parameters the time spent by the method (in msg.), the method name to run, the result of this method and parameters that
      * need the method.
      * @private
      * @type {Function}
      * @return void */
    var _notify = function (elapsed, nameFunct, result, args) {
        //if(_info[nameFunct]) nameFunct += "_BIS";
        var path = Util.LIFO.path;
        _info[nameFunct] = {
            "path": path,
            "elapsed": elapsed,
            "result": result,
            "args": [].slice.call(args),
            "type": Util.UI.getPropertyType(_target, nameFunct) //A number indicating the type of property
        };
        //USE THE UI
        if (_container && _wrapperInfo && _wrapperEvents) {
            //CREATE THE MISSING ELEMENTS OF THE ROUTE AND GETS THE FATHER OF ALL THEM
            var padre = Util.UI.buildDOMPath(_wrapperEvents, path);
            //STYLING FOR ELEMENT AND PROVIDES INFORMATION
            padre = Util.UI.fatherStylized(padre, _target, path);
            //OBTAIN THE REFERENCE TO  DOM ELEMENT CREATED (THE LAST OF THE ROUTE)
            var el = Util.UI.getLastDOMPath(_wrapperEvents, path);
            //STYLING FOR ELEMENT AND PROVIDES INFORMATION
            el = Util.UI.propertyStylized(el, _target, elapsed, nameFunct, path, result, args);
        }
    };
    /** DOMElement container to insert the entire user interface and the result of tracking methods.
      * @private
      * @type {HTMLElement}
      * @default none */
    var _container;
    /** This element is created from the 'prepareBody' method and serves as secondary container of the entire UI, usually to insert information
      * such as the number of object methods.
      * IMPORTANT: There must exist previously to the main 'container' element.
      * @private
      * @type {HTMLElement}
      * @default null
      * @defaultvalue null */
    var _wrapperInfo = null;
    /** Element created by the 'preparedBody' method, will house tracking methods fired by the object to be treated.
      * IMPORTANT: There must exist previously to the main 'container' element.
      * @private
      * @type {HTMLElement}
      * @default null */
    var _wrapperEvents = null;

    //FUNCTIONS FOR THE PUBLIC API
    /** You may be calling this constructor with a callback function that will injected within each executed method.
      * @constructor
      * @constructs
      * @summary CONSTRUCTOR.
      * @param {Object} obj - The Javascript object to 'wrapper'.
      * @param {HTMLElement|string} container - The 'HTMLElement' or its 'idElement' to serve as container for all UI.
      * @param {Function} callback [OPTIONAL] - The function to embed within each object method. */
    function WrapperTracer(obj, container, callback) {
        //_initialize(obj, container, callback);
        /** @summary Original Object */
        _target = obj; //ORIGINAL OBJECT, DOESN'T MODIFY
        /** Outer function to insert in 'wrapped' object within each method. [OPCIONAL]
          * @summary Callback to insert in the wrapped. */
        _callback = callback;
        /** Build the UI informative interface
          * @summary container element */
        _container = setContainer(container);
        /**  Build the UI executive
          * @summary Object Wrapped. */
        _wrapped = Util.wrapp(obj, _callback, _notify); //WRAPPED OBJECT
        /** @summary SELF-GENERATED IDENTIFICATOR */
        _id = _wrapped["id"];
    }

    //PRIVATE FUNCTIONS
    /** Private method initializer. Which is used within internally constructor.
      * @private
      * @function
      * @param {Object} obj - The Javascript object to 'wrapper'.
      * @param {HTMLElement|string} container - The 'HTMLElement' or its 'idElement' to serve as container for all UI.
      * @param {Function} callback [OPTIONAL] - The function to embed within each object method.
      * @return void
      * @ignore */
    function _initialize(obj, container, callback) {

    }

    //GETTERs METHODS
    /** @summary Gets the id from this wrapper
      * @public
      * @type {Function}
      * @return {string} */
    WrapperTracer.prototype.getId = function () {
        return _id || _wrapped["id"];
    }
    /** @export
      * @summary Gets the original JS Object
      * @public
      * @type {Function}
      * @return {Object:Javascript} */
    WrapperTracer.prototype.getTarget = function () {
        return _target;
    }
    /** @export
      * @summary Gets the generated 'wrapped' Object
      * @public
      * @type {Function}
      * @return {Object:WrapperTracer.Util#wrapp} */
    WrapperTracer.prototype.getWrapped = function () {
        return _wrapped || Util.wrapp(_target, _callback, _notify);
    }
    /** <i style="display:none;">@ lends WrapperTracer.prototype</i>
      * @export
      * @summary Gets the external callback function, if it had provided the builder
      * @public
      * @type {Function}
      * @return {Function|null} */
    WrapperTracer.prototype.getCallback = function () {
        return _callback;
    }
    /** @export
      * @summary Gets the all properties from JS Object
      * @public
      * @type {Function}
      * @return {Object} */
    WrapperTracer.prototype.getProps = function () {
        return _props || Util.getProperties(_target, 0);
    }
    /** @export
      * @summary Gets information from JS Object
      * @public
      * @type {Function}
      * @return {Object} */
    WrapperTracer.prototype.getInfo = function () {
        return _info;
    }
    /** @export
      * @summary Gets the DOM Element which is container for the all UI
      * @public
      * @type {Function}
      * @return {Object:HTMLElement} */
    WrapperTracer.prototype.getContainer = function () {
        return _container;
    }
    /** @summary Returns the 'Util' Object.
      * @this {WrapperTracer}
      * @export
      * @public
      * @type {Function}
      * @return {Object:WrapperTracer.Util} */
    WrapperTracer.prototype.getUtil = function(){
      return Util;
    }
    //SETTERs METHODS
    /** Setter method to set the container to house all the UI. It also prepares the body of the container (info and events)
      * @summary Sets the UI container
      * @export
      * @public
      * @type {Function}
      * @param {HTMLElement|string} container - The 'HTMLElement' or its 'idElement' to serve as container for all UI.
      * @return {HTMLElement} */
    WrapperTracer.prototype.setContainer = function (container) {
        _container = container;
        _container = Util.UI.prepareBody(_container);
        if (_container) {
            var divs = _container.getElementsByTagName("div"); //.getElementsByClassName("wrapperInfo");
            _wrapperInfo = divs[0];
            _wrapperEvents = divs[1];
            _wrapperInfo = Util.UI.buildPropertiesInfo(_wrapperInfo, _target);
        }
        return _container;
    }

    return WrapperTracer;
})();
//# sourceMappingURL=WrapperTracer.en.js.map