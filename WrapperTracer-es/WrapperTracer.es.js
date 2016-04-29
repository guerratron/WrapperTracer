/** @module WrapperTracer */

/**
  * <i style="display:none;">@namespace</i>
  * @class
  * @classdesc
  * <img src="img/WrapperTracer-logo.png" title="WrapperTracer logo" alt="logo" style="float:right;" />
  * <p>Crea un objeto ENVOLVENTE que rastrea la ejecución de métodos de otros objetos. Sirve de 'TRACER'
  * para obtener una representación visual del ciclo de ejecución de los métodos, así como de
  * ayuda con información (tiempos empleados, anidación, tipos de métodos, parámetros, ...).
  * Con sólo dos parámetros necesarios: El 'objeto original' y el elemento 'DOM contenedor',
  * obtenemos el objeto 'wrapped' y toda la intefaz visual.</p>
  *  
  * @overview 
  * <p>Esta 'clase' se apoya profúsamente en las funciones de utilidad que contiene otro objeto
  * implementado en este mismo archivo, el objeto {@link WrapperTracer#Util} 'UTIL', que contiene métodos y objetos
  * estáticos que, aunque están orientados de forma específica para el objeto 'wrapper', podrían
  * utilizarse fuera del mismo siguiendo su 'classpath'.</p>
  * <p>El constructor admite tres parámetros: </p>
  * <ul>
  *   <li>{Object} obj - El objeto Javascript a 'wrappear'.</li>
  *   <li>{HTMLElement|string} container - El elemento 'HTMLElement' o su 'idElement' que servirá como contenedor a toda la UI.</li>
  *   <li>{Function} callback [OPTIONAL] - La función a embeber en cada método del objeto.</li>
  * </ul>
  * <p>PROBADO EN :: http://jsperf.com/wrapper-compare/3</p>
  * @example <caption>Wrappear un objeto JS.</caption>
  * // Obtiene el Wrappeador y construye toda la interfaz en el elemento 'idElement'
  * var wrapper = new WrapperTracer(objJS, 'idElement', null);
  * // Obtiene el Wrappeado
  * var wrapped = wrapper.getWrapped();
  * //Ejecuta un método en el objeto Wrappeado para observar su rastreo y seguimiento
  * wrapped.execBlahBlahBlah(blah, blah, blah);
  *
  * @author GuerraTron - 2015. <dinertron@gmail.com> - GPL-v3
  * @version 1.0.0b
  * @summary Es un <b>namespace</b> / <b>clase</b> que genera un <b>Wrappeador</b> para inyectar eventos en métodos 
  * de objetos y rastrear su ciclo de ejecución.
  * @namespace WrapperTracer {namespace}
  */
var WrapperTracer = (function Auto() {
    /** OBJETO ESTÁTICO CON MÉTODOS DE UTILIDAD, PERO SIN ESTADO
      * @summary Objeto estático de utilidad. Puede obtenerse a través de su GETTER {@link WrapperTracer#getUtil()}
      * @name Util
      * @inner
      * @private
      * @memberof module:WrapperTracer
      * @property {Object} Util - The Util object
      * @property {Function} Util.wrapp - The wrapped object
      * @property {Function} Util.clone - Clona el objeto original
      * @property {Function} Util.inyect - Inyecta eventos en los métodos
      * @property {Function} Util.getProperties - Obtiene un listado con las propiedades
      * @property {Object} Util.LIFO - Pila que administra las rutas
      * @property {Object} Util.UI - Construye la interfaz
      * @property {Function} Util.addClass - Añade clase a un elemento DOM
      * @property {Function} Util.removeClass - Elimina una clase de un elemento DOM
      * @property {Function} Util.toggleClass - Añade/Suprime una clase a un elemento DOM
      * @property {Function} Util.hasClass - Comprueba la existencia de una clase en un elemento DOM
      * @property {Function} Util.addEvent - [CROSS-BROWSER] Añade un evento a un elemento DOM
      * @property {Function} Util.removeEvent - [CROSS-BROWSER] Suprime un evento en un elemento DOM
      * @property {Function} Util.hasEvent - [CROSS-BROWSER] Comprueba la existencia de un evento en un elemento DOM
      * @property {Function} Util.toggleDisplay - Conmuta la visibilidad de un elemento DOM
      * @property {Function} Util.getClassName - Obtiene un nombre de clase basándose en un objeto
      * @property {string} Util.name - [DEBUG] Nombre de este objeto.
      */
    var Util = {
        /** ESTÁTICO:: Wrappea todas las propiedades (objetos, funciones, strings, ...) que hayan
          * sido definidas con anterioridad en el objeto, incluso si han sido definidas con
          * 'undefined'. El resto de propiedades (internas o no definidas) NO APARECEN.
          * Las propiedades se establecen igual que en el objeto original, respetando las
          * suyas propias y las de su prototipo.
          * CONCLUSIÓN: Para que apareccan incluso las propiedades no definidas sería
          * necesario establecerlas a 'undefined' en el objeto original !!.
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {Object} obj - El objeto original 
          * @param {Function} callback - La función externa de callback a inyectar 
          * @param {Function} notify - Otra función interna para inyectar
          * @return {Object} */
        wrapp: function (obj, callback, notify) {
            // Primero clona todas las propiedades
            var wrapped = Util.clone(obj);
            // Luego injecta los eventos 'Tracers' en cada método
            for (var p in obj) {
                if (typeof obj[p] === "function") {
                    wrapped[p] = Util.inject(wrapped, obj, p, callback, notify);
                }
            }
            return wrapped;
        },
        /** ESTÁTICO:: Se encarga de clonar el objeto original en el wrapped y retornarlo, diferenciando
          * los métodos propios de los prototípicos 
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {Object} obj - El objeto original
          * @return {Object} */
        clone: function (obj) {
            /** IDENTIFICADOR */
            var id = ("WrapperTracer-" + new Date().getTime() + "-" + Math.floor((Math.random() * 10) + 1));
            //CONSTRUCTOR
            function F(id) {
                this.id = id;
            }
            var wrapped = new F(id); //new (function(){});   //resetea el objeto
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
        /** ESTÁTICO:: Inyecta en un método concreto de un objeto el evento traceador 
          * @memberof module:WrapperTracer.Util 
          * @type {Function} 
          * @param {Object} wrapped - El objeto wrappeado 
          * @param {Object} obj - El objeto original 
          * @param {string} nameFunct - El nombre del método en el que inyectar 
          * @param {Function} callback - La función externa de callback a inyectar 
          * @param {Function} notify - Otra función interna para inyectar
          * @return {Function} */
        inject: function (wrapped, obj, nameFunct, callback, notify) {
            return function () {
                Util.LIFO.add(nameFunct); //añade un elemento a la ruta a seguir
                var timeIni = new Date().getTime(); //msg.
                var result = obj[nameFunct].apply(wrapped, arguments);
                var elapsed = new Date().getTime() - timeIni; //msg.
                if (notify) {
                    notify(elapsed, nameFunct, result, arguments);
                }
                if (callback) {
                    callback(elapsed, nameFunct, result, arguments);
                }
                Util.LIFO.del(); //suprime el último elemento de la ruta a seguir
                return result;
            };
        },
        /** ESTÁTICO:: Obtiene todas las propiedades del objeto original (strings, numbers, functions, ...) tanto
          * propias como de su prototipo (según el parámetro pasado) y construye un objeto con todas
          * ellas separadas por su tipo (objects, functions, strings, numbers, booleans y undefineds) y
          * lo retorna. 
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {Object} obj - El objeto original 
          * @param {number} own - Sólo propiedades propias (1), heredadas (-1), o ambas (0).
          * @return {Object} */
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
        /** Objeto útil para crear rutas de profundidad o de seguimiento, similar a pilas LIFO.
          * Contiene un elemento Raiz del que parten (separados mediante el parámetro SEP) los
          * distintos elementos que vayamos agregandole. Contiene métodos 'add', 'del', 'count', 'last' y 'reset'
          * @memberof module:WrapperTracer.Util 
          * @name LIFO 
          * @inner
          * @type {Object} 
          * @property {Object} LIFO - The LIFO stack
          * @property {string} LIFO.root - Ruta raiz
          * @property {string} LIFO.path - Ruta a seguir
          * @property {string} LIFO.SEP - Símbolo separador
          * @property {Function} LIFO.add - Añade elemento
          * @property {Function} LIFO.del - Suprime elemento 
          * @property {Function} LIFO.last - Último elemento
          * @property {Function} LIFO.count - Cuenta elementos
          * @property {Function} LIFO.reset - Reinicializa a 'root' */
        LIFO: {
            /** Elemento Raiz de la ruta. Siempre existirá. */
            root: "WrapperTracer",
            /** Parámetro que registra la ruta a seguir. */
            path: "WrapperTracer",
            /** Símbolo separador para cada elemento de la ruta. */
            SEP: ".",
            /** Suma o agrega un nuevo elemento a la ruta */
            add: function (name) {
                this.path = this.path + this.SEP + name;
            },
            /** Suprime el último elemento de la ruta sin permitir que se quede vacía */
            del: function () {
                if (this.path.split(this.SEP).length > 1) {
                    var arr = this.path.split(this.SEP);
                    arr.pop();
                    this.path = arr.join(this.SEP);
                }
            },
            /** Retorna el último elemento de la ruta, sin afectarla. */
            last: function () {
                return this.path.split(this.SEP)[this.path.split(this.SEP).length - 1];
            },
            /** Cuenta los elementos que contiene la ruta */
            count: function () {
                return this.path.split(this.SEP).length;
            },
            /** Reinicializa la ruta al elemento 'root' */
            reset: function () {
                this.path = this.root;
            }
        },
        /** Objeto útil para crear la interfaz de rastreo de los métodos ejecutados en el objeto
          * @memberof module:WrapperTracer.Util 
          * @name UI 
          * @inner
          * @type {Object} 
          * @property {Object} UI - The UI builder
          * @property {function} UI.fatherStylized - Estiliza elementos padre
          * @property {Object} UI.propertyStylized - Estiliza propiedades
          * @property {Function} UI.getDepthColor - Color en función de la profundidad
          * @property {Function} UI.getPropertyTypeColor - Color en función del tipo de propiedad
          * @property {Function} UI.getPropertyTypeNamed - Nombre en función del tipo de propiedad 
          * @property {Function} UI.getPropertyType - Número representando el tipo de propiedad
          * @property {Function} UI.prepareBody - Construye la UI
          * @property {Function} UI.buildPropertiesInfo - Construye información de TODAS las propiedades
          * @property {Function} UI.buildPropertyInfo - Construye información UNA propiedad
          * @property {Function} UI.buildDOMPath - Construye árbol DOM de la ruta
          * @property {Function} UI.getLastDOMPath - Retorna el último elemento DOM de la ruta
          * @property {Function} UI.enhanced - [EFECTOS] Resalta el borde, indicando el tiempo en msg.
          * @property {Function} UI.highlight - [EFECTOS] Resalta el borde, indicando el color HTML.
          * @property {Function} UI.transparency - [EFECTOS] Aplica transparencia (0-1). */
        UI: {
            /** Estiliza el padre de todos los elementos que representen métodos ejecutados y lo retorna pero estilizado.
              * Sólo lo estiliza la primera vez */
            fatherStylized: function (padre, obj, path) {
                //ESTILIZA EL PADRE
                if ((padre)) {
                    var h6, hr, a;
                    if (padre.getElementsByTagName("h6").length > 0) {
                        h6 = padre.getElementsByTagName("h6")[0];
                        //RECOLOCA AL FINAL EL ELEMENTO Hr
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
                    a.href = "#" + path; //NOS DIRIGE HASTA EL ELEMENTO
                    //RESALTA EL ELEMENTO Y DISPARA SU MÉTODO ASOCIADO
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
                    //RESALTA EL ELEMENTO MIENTRAS SE ENCUENTRA SOBRE EL ENLACE
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
                    //DES-RESALTA EL ELEMENTO
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
                    //OCULTA/MUESTRA TODOS LOS HIJOS AL PULSAR EN EL PADRE TOTAL
                    function showHideInFather(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var hijos = padre.getElementsByTagName("div");
                        for (var i = 0; i < hijos.length; i++) {
                            Util.toggleDisplay(hijos[i]);
                        }
                        return true; //CONSUMIDO
                    }
                    //Util.removeEvent (padre, "click", showHideInFather);
                    //Util.addEvent (padre, "click", showHideInFather);
                    padre.onclick = showHideInFather;
                }
                return padre;
            },
            /** Estiliza la propiedad que corresponde al elemento pasado. Sus propiedades serán el tiempo empleado por
              * el método ejecutado, el nombre del método, su ruta, el resultado y los argumentos consumidos por el
              * método. También se entrega el objeto (el original o el wrappedao) para obtener la función de referencia
              * y utilizarla en el disparador (evento 'onclick').
              * Retorna el mismo elemento DOM de los parámetros pero estilizado. */
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
                    //INFORMACIÓN DEL MÉTODO
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
                    //NOMBRE DE FUNCIÓN Y PARÁMETROS
                    var parr = document.createElement("p");
                    parr.style.color = "maroon";
                    parr.style.fontSize = "larger";
                    parr.innerHTML = nameFunct + " ( " + params + " ) ";
                    p.insertBefore(parr, p.childNodes[0]);
                    //TYPO DE MÉTODO Y DISPARADOR
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
                    //Elemento DISPARADOR del método
                    var firer = document.createElement("img");
                    //IMG BASE64 RAYO  : data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAgMAAABinRfyAAAACVBMVEVHAGiSXx700VSdCvDNAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQffDAMWDTUDTyMZAAAARElEQVQI12NgYNBawcDAsHIBkFjWwMDANAvI4MoAEpogITWgEMOqZQsYmFYtA7IYZgAxUwKQ4ARJaICEJoCEQDwOIAYAKIgLxkkVELUAAAAASUVORK5CYII=
                    //IMG BASE64 DIANA : data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAFVBMVEVvcm0BAQD7AAD0BQHzBgLYHwn7/Bog997YAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQffDAMWDQfLmHKZAAAAVElEQVQI12NgQALBphDaSUlJBUQzKSkKKSmABYAMkJCSUqKYkhIDA6uSWqJYklIAA7OSmqJQkpIBggGUSlIDSQEVp6WBFIPMg5jIBGIoIFuBsBQCALW2DWubFikRAAAAAElFTkSuQmCC
                    //IMG BASE64 DIANA2: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMBAMAAACkW0HUAAAAFVBMVEX/jYvEAAL0AAC2Hx1CSVDKtLL8//uFUdIFAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAAFxIAABcSAWef0lIAAAAHdElNRQffCwcRBRS/8uSNAAAAMUlEQVQI12NggAEXFwgJpl3c0lwcGFhc0sCUW5JiCogKEgRTycJACqoEpoHFBcSBAADyqwwbcf9r5QAAAABJRU5ErkJggg=="
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
                    //EVENTOS DISPARADOR
                    Util.addEvent(firer, "mouseenter", function borderShowFirer(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        firer.style.border = "2px dashed red";
                        return true;
                    });
                    Util.addEvent(firer, "mouseleave", function borderHideFirer(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        firer.style.border = "1px ridge maroon";
                        return true;
                    });
                    //AL HACER CLICK EN LA FUNCIÓN PASA LOS ARGUMENTOS
                    Util.addEvent(firer, "click", function execFunction(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (obj && obj[nameFunct]) {
                            obj[nameFunct].apply(obj, args);
                        }
                        return true;
                    });
                    //EVENTOS ELEMENTO
                    Util.addEvent(p, "click", function eventNull(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return true;
                    });
                    Util.addEvent(p, "mouseenter", function borderShowP(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        p.style.border = "2px ridge red";
                        return true;
                    });
                    Util.addEvent(p, "mouseleave", function borderHideP(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        p.style.border = "1px ridge maroon";
                        return true;
                    });
                    //OCULTA/MUESTRA TODOS LOS HIJOS 'DIV' DEL ELEMENTO SI LOS TIENE
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
            /** Retorna un color HTML en base a la profundidad de su ruta. Permite unos colores rgb iniciales ([red, green, blue]) */
            getDepthColor: function (path, rgb) {
                rgb || (rgb = [220, 125, 25]);
                var depth = path.split(Util.LIFO.SEP).length * 25;
                return ("RGB(" + parseInt((rgb[0] + depth / 8) + "") + ", " +
                    parseInt((rgb[1] + depth / 2) + "") + ", " +
                    parseInt((rgb[2] + depth) + "") + ")");
            },
            /** Retorna un color HTML en base al tipo de propiedad (function, object, string, ...) y su herencia.
              * También puede obtenerse el color indicando su índice (se obviarán el resto de parámetros).
              * Utiliza internamente el método 'getPropertyType' */
            getPropertyTypeColor: function (obj, prop, index) {
                if (index === void 0) { index = undefined; }
                if (isNaN(index))
                    index = Util.UI.getPropertyType(obj, prop);
                switch (index) {
                    //FUNCTION
                    case 0: return "chartreuse"; //"function OWN"
                    case 1: return "limeGreen"; //"function HEREDADA"
                    //OBJECT
                    case 2: return "mediumPurple"; //"object OWN"
                    case 3: return "blueViolet"; //"object HEREDADA"
                    //ARRAY
                    case 4: return "khaki"; //"array OWN"
                    case 5: return "darkKhaki"; //"array HEREDADA"
                    //STRING
                    case 6: return "navajoWhite"; //"string OWN"
                    case 7: return "coral"; //"string HEREDADA"
                    //NUMBER
                    case 8: return "skyBlue "; //"number OWN"
                    case 9: return "steelBlue"; //"number HEREDADA"
                    //BOOLEAN
                    case 10: return "cadetBlue"; //"boolean OWN"
                    case 11: return "Turquoise"; //"boolean HEREDADA"
                    //UNDEFINED
                    case 12: return "#AAAAAA"; //"undefined OWN"
                    case 13: return "#666666"; //"undefined HEREDADA"
                    //NULL
                    case 14: return "dimGray"; //"null OWN"
                    case 15: return "darkSlateGray"; //"null HEREDADA"
                    //UNKNOW
                    case 16: return "darkGray"; //"desconocida OWN"
                    case 17: return "lightGray"; //"desconocida HEREDADA"
                    //NON-EXISTENT
                    default: return "#333333"; //INEXISTENTE
                }
                return "#555555";
            },
            /** Retorna un nombre en base al tipo de propiedad (function, object, string, ...) y su herencia.
              * También puede obtenerse el nombre indicando su índice (se obviarán el resto de parámetros).
              * Utiliza internamente el método 'getPropertyType' */
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
            /** Retorna el tipo de propiedad (function, object, string, ...) teniendo en cuenta su herencia. */
            getPropertyType: function (obj, prop) {
                if (obj) {
                    var own = obj.hasOwnProperty(prop); //comprueba si la propiedad es propia o heredada.
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
            /** Construye y aplica estilos a la UI. Necesita que exista el elemento contenedor (admite su id).
              * @return Retorna el elemento del DOM (HTMLDivElement) */
            prepareBody: function (container) {
                //::prepareBody::
                if (container) {
                    //Controla si se ha colado una cadena
                    try {
                        if (typeof container === "string") {
                            container = document.getElementById(container + "");
                        }
                        container.id = container.id; //provoca una excepción si no existe container
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
                    //TITULO
                    var h4 = document.createElement("h4");
                    h4.id = "wrapperInfo-title";
                    h4.innerHTML = "ESQUELETO DEL OBJETO: ";
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
                    wrapperEvents.innerHTML = "EVENTOS (TRAITS) DEL OBJETO:";
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
            /** Construye toda la información relativa a TODOS los métodos y propiedades del objeto, se utilicen o no, mostrando
              * información relevante como el tipo de propiedad y su valor.
              * Llama internamente a Util.UI.buildPropertyInfo(...) */
            buildPropertiesInfo: function (container, obj) {
                //::buildPropertiesInfo::
                if (container && obj) {
                    //TITULO DEL WRAPPER
                    var tituloWrapper = container.parentNode.firstChild; //el titulo ya existia en un elemento Heading h4
                    tituloWrapper.textContent += " '" + Util.getClassName(obj) + "' [" + typeof obj + "]";
                    //CONTENEDOR DE LAS PROPIEDADES
                    var divP = document.createElement("div");
                    divP.className = "wrapperProperties";
                    divP.style.clear = "both";
                    container.appendChild(divP);
                    //OCULTAR LAS PROPIEDADES
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
                    //DIVISIONES DE PROPIEDADES (NUMBER, STRINGS, OBJECTS, ARRAYS Y FUNCIONES)
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
                    /** Objeto interno para Organizar los tipos de métodos */
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
            /** Construye la información relativa a UNA propiedad del objeto, se utilice o no, mostrando
              * información relevante como el tipo de propiedad y su valor.
              * El parámetro <b>'objElements'</b> contendrá los elementos 'divs' que albergarán todos los métodos y
              * propiedades en función de su tipo. Sirve para organizar los métodos y está pensado en principio para
              * que albergue al menos la siguiente extructura:
              * <pre>
              * var objElements = {
              *   "pNumberString" : pNumberString,
              *   "pObjectArray" : pObjectArray,
              *   "pFunction" : pFunction
              * } 
              * </pre> */
            buildPropertyInfo: function (container, obj, s, objElements) {
                if (container && obj) {
                    //PROPIEDAD
                    var divElements = null;
                    var p = document.createElement("div");
                    var own = obj.hasOwnProperty(s);
                    var iconTypeTxt = "?";
                    var iconTypeColor = "white"; //en tipe color se almacena el color parejo al del método
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
                    //TITULO DE LA PROPIEDAD
                    var title = document.createElement("h3");
                    title.className = "wrapperTitleProperty";
                    title.style.display = "inline";
                    title.title = "Property type: [" + (typeof obj[s]) + "]";
                    title.appendChild(document.createTextNode(" = " + s + " = "));
                    //CUERPO DE LA PROPIEDAD
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
                    //ICONO
                    var iconTxt = document.createElement("span");
                    iconTxt.innerHTML = iconTypeTxt;
                    iconTxt.style.padding = "2px";
                    iconTxt.style.background = iconTypeColor;
                    iconTxt.style.borderRadius = "2px";
                    iconTxt.style.cssFloat = "right";
                    iconTxt.style.width = "16px";
                    iconTxt.style.textShadow = "1px 1px whiteSmoke";
                    iconTxt.title = Util.UI.getPropertyTypeNamed(obj, s) + " [" + (own ? "Directa" : "Heredada") + "]";
                    iconTxt.style.cursor = "pointer";
                    p.appendChild(title);
                    p.appendChild(iconTxt);
                    p.appendChild(body);
                    divElements.appendChild(p);
                }
                return container;
            },
            /** WARNIGN:: FUNCION RECURSIVA::
              * Construye el árbol DOM especificado por la ruta en el elemento contenedor indicado, y retorna el
              * elemento Padre de todos ellos.
              * La ruta normálmente será en formato 'punto': uno.dos.tres */
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
                        p.id = p.id; //si no existe el elemneto producirá una excepción
                    }
                    catch (e) {
                        p = document.createElement("div");
                        p.id = path2;
                        pContainer.appendChild(p);
                    }
                    //SI TIENE MÁS DE UNA PARTE ENTONCES RECURSIVIDAD
                    if (partes.length > 1) {
                        var ppp = buildDOMPath(p, partes.slice(1).join(Util.LIFO.SEP));
                        if (ppp) {
                            p.appendChild(ppp);
                        }
                    }
                }
                return p;
            },
            /** Retorna una referencia al último elemento DOM de la ruta. El elemento debe existir en el árbol DOM. */
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
                            p.id = p.id; //si no existe el elemneto producirá una excepción
                            pContainer = p;
                        }
                        catch (e) {
                            p = null;
                            break; //Sale del For con un elemento NULO. Aún no se encuentra construido en el DOM
                        }
                    }
                }
                return p;
            },
            /** Resalta el elemento basándose en su propiedad de estilo 'border'. Permite especificar el tiempo de resaltado (en msg.)
              * Se retorna el objeto 'Util' para permitir 'chaining' */
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
            /** Resalta el elemento basándose en su propiedad de estilo 'border'. Permite especificar el color HTML de resaltado.
              * Se retorna el objeto 'Util' para permitir 'chaining' */
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
            /** Resalta el elemento basándose en su propiedad de estilo 'opacity'. Permite especificar el nivel de transparencia (0-1).
              * Se retorna el objeto 'Util' para permitir 'chaining' */
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
        /** Agrega una clase a un elemento (si no existía con anterioridad). Se vale de la moderna propiedad 'classList'
          * en caso de soportarla, sinó, se le aplica un 'shim code'.
          * Se retorna el objeto 'Util' para permitir 'chaining'
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {HTMLElement} elem - Elemento DOM
          * @param {string} className - La clase a insertar
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
        /** Suprime una clase a un elemento (si existía con anterioridad). Se vale de la moderna propiedad 'classList'
          * en caso de soportarla, sinó, se le aplica un 'shim code'.
          * Se retorna el objeto 'Util' para permitir 'chaining'
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {HTMLElement} elem - Elemento DOM
          * @param {string} className - La clase a suprimir
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
        /** Conmuta una clase en un elemento (si existe la suprime y sinó la agrega). Se vale de la moderna propiedad 'classList'
          * en caso de soportarla, sinó, se le aplica un 'shim code'.
          * Se retorna el objeto 'Util' para permitir 'chaining'
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {HTMLElement} elem - Elemento DOM
          * @param {string} className - La clase a conmutar
          * @return {Object:this} */
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
        /** Averigua si el elemento contiene la clase especificada. Se vale de la moderna propiedad 'classList'
          * en caso de soportarla, sinó, se le aplica un 'shim code'.
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {HTMLElement} elem - Elemento DOM
          * @param {string} className - La clase a comprobar
          * @return {Object:this} */
        hasClass: function myFunction(elem, className) {
            if (elem.classList) {
                return elem.classList.contains(className);
            }
            return (elem.className.indexOf(className) > -1);
        },
        /** COMPATIBILIZADOR DE EVENTOS
          * donde 'elem' es el elemento sobre el que se quiere establecer la escucha, 'enventType' el evento (sin prefijo 'on')
          * y 'handler' la función a ejecutar
          * Se retorna el objeto 'Util' para permitir 'chaining'
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {HTMLElement} elem - Elemento DOM
          * @param {string} eventType - El tipo de evento ('click', 'mouseover', 'mouseout', ...)
          * @param {Function} handler - Función a ejecutar en el evento
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
        /** COMPATIBILIZADOR DE EVENTOS
          * donde 'elem' es el elemento sobre al que se le quiere quitar la escucha, 'enventType' el evento (sin prefijo 'on')
          * y 'handler' la función a suprimir.
          * Se retorna el objeto 'Util' para permitir 'chaining'
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {HTMLElement} elem - Elemento DOM
          * @param {string} eventType - El tipo de evento ('click', 'mouseover', 'mouseout', ...)
          * @param {Function} handler - Función a remover en el evento
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
        /** COMPATIBILIZADOR DE EVENTOS
          * donde 'elem' es el elemento sobre el que se quiere averiguar si existe el evento y 'enventType' es el evento (sin prefijo 'on')
          * a comprobar su existencia.
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {HTMLElement} elem - Elemento DOM
          * @param {string} eventType - El tipo de evento ('click', 'mouseover', 'mouseout', ...)
          * @return {boolean} */
        hasEvent: function (elem, eventType) {
            eventType = (elem.attachEvent) ? "on" + eventType : eventType;
            var comprobacion1 = (typeof elem[eventType] == "function");
            var comprobacion2 = (elem[eventType] !== undefined);
            var comprobacion3 = elem.hasOwnProperty(eventType);
            return comprobacion1 || comprobacion2;
        },
        /** Conmuta la visualización de un elemento (si se muestra lo oculta y viceversa) basándose en su propiedad de estilo 'display'.
          * Se retorna el objeto 'Util' para permitir 'chaining'
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {HTMLElement} elem - Elemento DOM
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
        /** Extrae el nombre de la clase a la que pertenece el objeto en cuestión.
          * @memberof module:WrapperTracer.Util 
          * @type {Function}
          * @param {Object} obj - Objeto JS del que obtener un nombre de clase apropiado
          * @return {string} */
        getClassName: function (obj) {
            return (obj && obj.constructor) ? ("" + obj.constructor).split("function ")[1].split("(")[0].trim() : "[NONE]";
        },
        /** Simplemente para propósitos de depuración
          * @memberof module:WrapperTracer.Util 
          * @type {string} */
        name: "Util"
    }; //FIN DE UTIL
    
    /** IDENTIFICADOR
      * @private
      * @type {string}
      * @default none */
    var _id; //= "WrapperTracer-"+new Date().getTime +"-"+ Math.floor((Math.random()*10)+1);
    /** Objeto Original 
      * @private
      * @type {Object:Javascript}
      * @default none */
    var _target; //OBJETO ORIGINAL, NO SE MODIFICA
    /** Objeto Wrappeado
      * @private
      * @type {Object:WrapperTracer#Wrapped}
      * @default none */
    var _wrapped; //OBJETO WRAPPEADO
    /** Agrupación de Propiedades (string, numbers, functions, objects, ...) en un Objeto, tanto propiedades propias como privadas.
      * @private
      * @type {Object}
      * @default empty {} */
    var _props = {}; //OBJETO DE ARRAYs
    /** Recopilación de objetos informativos para cada método ejecutado, donde se muestran informaciones
      * como el tiempo consumido, el resultado de la operación, los diferentes parámetros, pasados, ...
      * @private
      * @type {Object}
      * @default empty {} */
    var _info = {};
    /** Función externa a insertar en el objeto 'wrappeado' dentro de cada método. [OPCIONAL]
      * Se le van a pasar como parámetros el tiempo consumido por el método (en msg.), el nombre del método
      * a ejecutar, el resultado de ese método y los parámetros que necesite ese método.
      * Permite interactuar externamente con la API, es una forma de extender sus posibilidades.
      * @private
      * @type {Function}
      * @default none
      * @return {void|number|boolean|string|object} anything */
    var _callback;
    /** Función interna que se insertará en el objeto 'wrappeado' dentro de cada método, para seguir un
      * rastro de su actividad.
      * Se le van a pasar como parámetros el tiempo consumido por el método (en msg.), el nombre del método
      * a ejecutar, el resultado de ese método y los parámetros que necesite ese método.
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
            "type": Util.UI.getPropertyType(_target, nameFunct) //Número que indica el tipo de propiedad
        };
        //UTILIZA LA UI
        if (_container && _wrapperInfo && _wrapperEvents) {
            //CREA LOS ELEMENTOS FALTANTES DE LA RUTA Y OBTIENE EL PADRE DE TODOS ELLOS
            var padre = Util.UI.buildDOMPath(_wrapperEvents, path);
            //ESTILIZA EL ELEMENTO Y LE APORTA INFORMACIÓN
            padre = Util.UI.fatherStylized(padre, _target, path);
            //OBTIENE LA REFERENCIA AL ELEMENTO DOM CREADO (EL ÚLTIMO DE LA RUTA)
            var el = Util.UI.getLastDOMPath(_wrapperEvents, path);
            //ESTILIZA EL ELEMENTO Y LE APORTA INFORMACIÓN
            el = Util.UI.propertyStylized(el, _target, elapsed, nameFunct, path, result, args);
        }
    };
    /** DOMElement contenedor para insertar toda la interfaz de usuario y el resultado del rastreo de los
      * métodos.
      * @private
      * @type {HTMLElement}
      * @default none */
    var _container;
    /** Este elemento lo crea el método 'prepareBody' y sirve como contenedor secundario de toda la UI,
      * generalmente para insertar información como la cantidad de métodos del objeto.
      * IMPORTANTE: Debe existir con anterioridad el elemento principal 'container'.
      * @private
      * @type {HTMLElement}
      * @default null
      * @defaultvalue null */
    var _wrapperInfo = null;
    /** Elemento creado por el método 'prepareBody', albergará el seguimiento de los métodos disparados por el objeto a tratar.
      * IMPORTANTE: Debe existir con anterioridad el elemento principal 'container'.
      * @private
      * @type {HTMLElement}
      * @default null */
    var _wrapperEvents = null;
    
    //FUNCIONES PARA LA API PÚBLICA
    /** Se le puede llamar a este constructor con una función callback que se injectará en cada método ejecutado.
      * <i style="display:none;">@ lends WrapperTracer.prototype</i>
      * @constructor
      * @constructs
      * @summary CONSTRUCTOR.
      * @param {Object} obj - El objeto Javascript a 'wrappear'.
      * @param {HTMLElement|string} container - El elemento 'HTMLElement' o su 'idElement' que servirá como contenedor a toda la UI.
      * @param {Function} callback [OPTIONAL] - La función a embeber en cada método del objeto. */
    function WrapperTracer(obj, container, callback) {
        //_initialize(obj, container, callback);
        /** @summary Objeto Original */
        _target = obj; //OBJETO ORIGINAL, NO SE MODIFICA
        /** Función externa a insertar en el objeto 'wrappeado' dentro de cada método. [OPCIONAL] 
          * @summary Callback a insertar en el wrapped. */
        _callback = callback;
        /** Construye la interfaz UI informativa
          * @summary Elemento Contenedor */
        _container = this.setContainer(container);
        /** Construye la interfaz ejecutiva
          * @summary Objeto Wrappeado. */
        _wrapped = Util.wrapp(obj, _callback, _notify); //OBJETO WRAPPEADO
        /** @summary IDENTIFICADOR AUTOGENERADO */
        _id = _wrapped["id"];
    }
    
    //FUNCIONES PRIVADAS
    /** Método privado inicializador. Lo utiliza intérnamente el constructor. 
      * @private
      * @function
      * @param {Object} obj - El objeto Javascript a 'wrappear'.
      * @param {HTMLElement|string} container - El elemento 'HTMLElement' o su 'idElement' que servirá como contenedor a toda la UI.
      * @param {Function} callback [OPTIONAL] - La función a embeber en cada método del objeto.
      * @return void
      * @ignore */
    function _initialize(obj, container, callback) {
        
    }
    
    //MÉTODOS GETTERs
    /** @summary Obtiene el Id de este wrapper 
      * @public
      * @type {Function}
      * @return {string} */
    WrapperTracer.prototype.getId = function () {
        return _id || _wrapped["id"];
    }
    /** @export
      * @summary Obtiene el Objeto JS original 
      * @public
      * @type {Function}
      * @return {Object:Javascript} */
    WrapperTracer.prototype.getTarget = function () {
        return _target;
    }
    /** @export
      * @summary Obtiene el Objeto 'wrapped' generado 
      * @public
      * @type {Function}
      * @return {Object:WrapperTracer.Util#wrapp} */
    WrapperTracer.prototype.getWrapped = function () {
        return _wrapped || Util.wrapp(_target, _callback, _notify);
    }
    /** <i style="display:none;">@ lends WrapperTracer.prototype</i>
      * @export
      * @summary Obtiene la función externa de callback, si se le había proporcionado al constructor
      * @public
      * @type {Function}
      * @return {Function|null} */
    WrapperTracer.prototype.getCallback = function () {
        return _callback;
    }
    /** @export
      * @summary Obtiene todas las propiedades del Objeto JS
      * @public
      * @type {Function}
      * @return {Object} */
    WrapperTracer.prototype.getProps = function () {
        return _props || Util.getProperties(_target, 0);
    }
    /** @export
      * @summary Obtiene información del Objeto JS
      * @public
      * @type {Function}
      * @return {Object} */
    WrapperTracer.prototype.getInfo = function () {
        return _info;
    }
    /** @export
      * @summary Obtiene el Elemento DOM contenedor de toda la UI
      * @public
      * @type {Function}
      * @return {Object:HTMLElement} */
    WrapperTracer.prototype.getContainer = function () {
        return _container;
    }
    /** @summary Retorna el objeto Util.
      * @this {WrapperTracer}
      * @export
      * @public
      * @type {Function}
      * @return {Object:WrapperTracer.Util} */
    WrapperTracer.prototype.getUtil = function(){
      return Util;
    }
    //METODOS SETTERs
    /** Método Setter para establecer el contenedor donde albergar toda la UI. También prepara el cuerpo de este contenedor (info y events)
      * @summary Establece el contenedor UI
      * @export
      * @public
      * @type {Function}
      * @param {HTMLElement|string} container - El elemento 'HTMLElement' o su 'idElement' que servirá como contenedor a toda la UI.
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
//# sourceMappingURL=WrapperTracer.es.js.map