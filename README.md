> -----------------------------------------------------------------------------------------------------
>   'WrapperTracer' (Class JS) - Analysis and 'JS Objects' Traces.  
>   Author: Juan José Guerra Haba - <dinertron@gmail.com> - Marzo de 2016  
>   License: Free BSD. & Open GPL v.3. Keep credit, please.  
>   Versión: 1.0.0 BETA   
>   File: WrapperTracer.js               Main Class: WrapperTracer.js  
>   
> ----------------------------------------------------------------------------------------------------

# WrapperTracer
[![WrapperTracer logo](WrapperTracer-en/img/WrapperTracer-logo.png "WrapperTracer GitHub page")](http://guerratron.github.io/WrapperTracer "WrapperTracer page")
It is a class that creates **Javascript** *wrapper* objects to allow *tracking* of the executed methods.

## Features 
  1. Do not in any way alter the original object
  2. Fully OOP
  3. Cross-browser
  4. Philosophy MVC
  5. Reduction to minimum of code to use by the user.

## Usage
Simply call the constructor with two parameters: The object *tracking* and **DOMElement** container element that will house the results for the **GUI**. The container element parameter can be a string containing the element **id**.
Ej:  

```javascript    
    var wrapped = new WrapperTracer(obj1, "containerUI");
```  
  
Of course you must be loaded before the **script** in the HTML header. 
````HTML
<script type="text/javascript" src="WrapperTracer.js"></script>
````

## Explanatory
It serve of **TRACER** to obtain a visual representation of methods's execution cycle, as help with information (elapsed time, nesting, methods type, parameters, ...).  
This class relies heavily on the utility functions of an internal object implemented in the same file, the **'Util'** object, which contains methods and objects statics that although they are geared specifically for object *'wrapper'*, they could be used outside the same using his *'classpath'*.

## Public API
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

## Authoring
Created and developed entirely by Juan Jose Guerra Haba. &lt;dinertron@gmail.com&gt;    
Copyright 2015 &copy; <a href="&#x6d;&#97;&#105;&#108;&#116;&#x6f;&#x3a;&#100;&#105;&#110;&#x65;&#x72;&#x74;&#114;&#x6f;&#110;&#64;&#x67;&#109;&#x61;&#x69;&#x6c;&#46;&#99;&#x6f;&#x6d;" title="author">GuerraTron</a>  
License GPL v3

### Developing &amp; Tools

Created with [Nodeclipse](https://github.com/Nodeclipse/nodeclipse-1)
 ([Eclipse Marketplace](http://marketplace.eclipse.org/content/nodeclipse), [site](http://www.nodeclipse.org))   
Nodeclipse is free open-source project that grows with your contributions.  
Debug by Firefox + Firebug
Additional editing and cleaning withNotepad++