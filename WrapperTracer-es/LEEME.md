> -----------------------------------------------------------------------------------------------------
>   'WrapperTracer' (Class JS) - Analiza y Rastrea Objetos JS.  
>   Author: Juan José Guerra Haba - <dinertron@gmail.com> - Marzo de 2016  
>   License: Free BSD. & Open GPL v.3. Keep credit, please.  
>   Versión: 1.0.0 BETA   
>   File: WrapperTracer.js               Main Class: WrapperTracer.js  
>   
> ----------------------------------------------------------------------------------------------------

# WrapperTracer
[![WrapperTracer logo](img/WrapperTracer-logo.png "Página Github WrapperTracer")](http://guerratron.github.io/WrapperTracer "Página WrapperTracer")
Es una *clase* **Javascript** que crea objetos ENVOLVENTES (*wrappers*) para permitir el **rastreo** (*tracer*) de los m&eacute;todos ejecutados.  

## Características 
 1. No altera de ninguna manera el objeto original
 2. Cross-browser
 3. Enteramente OOP
 4. Filosofía MVC
 5. Reducci&oacute;n al m&iacute;nimo del c&oacute;digo a emplear por el usuario.

## Utilización
S&iacute;mplemente llamar al constructor con dos par&aacute;metros: El objeto a **rastrear** y el elemento contenedor **DOMElement** que albergar&aacute; los resultados para la Interfaz Gr&aacute;fica. El par&aacute;metro del elemento contenedor puede ser una cadena de texto con el **id** del elemento.  
Ej:  

```javascript    
    var wrapped = new WrapperTracer(obj1, "containerUI");
```  
  
Por supuesto se debe cargar antes el **script** en la cabecera del HTML. 
````HTML
<script type="text/javascript" src="WrapperTracer.js"></script>
````

## Explicación
Sirve de **TRACER** para obtener una representaci&oacute;n visual del ciclo de ejecuci&oacute;n de los m&eacute;todos, as&iacute; como de ayuda con informaci&oacute;n (tiempos empleados, anidaci&oacute;n, tipos de m&eacute;todos, par&aacute;metros, ...).  
Con s&oacute;lo dos par&aacute;metros necesarios: El 'objeto original' y el elemento *'DOM contenedor'*, obtenemos el objeto *'wrapped'* y toda la intefaz visual.  
Esta *'clase'* se apoya prof&uacute;samente en las funciones de utilidad que contiene otro objeto implementado en este mismo archivo, el objeto **'UTIL'**, que contiene m&eacute;todos y objetos est&aacute;ticos que, aunque est&aacute;n orientados de forma espec&iacute;fica para el objeto *'wrapper'*, podr&iacute;an utilizarse fuera del mismo siguiendo su *'classpath'*.

## API Pública
<dl>
	<dt>Constructor</dt>
		<dd> WrapperTracer (object, idElement, callback);</dd>
	<dt>Getters</dt>
		<dd>getId ();</dd>
		<dd>getTarget ();</dd>
		<dd>getWrapped ();</dd>
		<dd>getCallback ();</dd>
		<dd>getProps ();</dd>
		<dd>getInfo ();</dd>
		<dd>getContainer ();</dd>
		<dd>getUtil ()</dd>
	<dt>Setters</dt>
		<dd>setContainer (idElement);</dd>
</dl>

## Autoría
Creado y Desarrollado íntegramente por Juan José Guerra Haba. &lt;dinertron@gmail.com&gt;    
Copyright 2015 &copy; <a href="&#x6d;&#97;&#105;&#108;&#116;&#x6f;&#x3a;&#100;&#105;&#110;&#x65;&#x72;&#x74;&#114;&#x6f;&#110;&#64;&#x67;&#109;&#x61;&#x69;&#x6c;&#46;&#99;&#x6f;&#x6d;" title="author">GuerraTron</a>  
License GPL v3

### Desarrollo Y Herramientas
Creado con [Nodeclipse](https://github.com/Nodeclipse/nodeclipse-1)
 ([Eclipse Marketplace](http://marketplace.eclipse.org/content/nodeclipse), [site](http://www.nodeclipse.org))   
Nodeclipse es software libre de código abierto, un proyecto que se mantiene con sus contribuciones.  
Depuración con Firefox + Firebug.  
Edición adicional y limpieza  con Notepad++  