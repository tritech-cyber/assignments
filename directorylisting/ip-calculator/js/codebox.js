// ------------------------------------
// CODEBOX



if (CODEBOX===undefined){
	var CODEBOX = {};
}

CODEBOX.addNamespace = function (namespaceName){
	function addNamespaceToObject(obj, namespace){
		if (!obj){
			obj = CODEBOX;
		}
		if (obj[namespace]===undefined){
			obj[namespace] = {};
		}	
		return obj[namespace];
	}
	
	var namespaceParts = namespaceName.split('.');
	var parentNamespace = null;
	var thisPart;
	
	for( var i=0; i<namespaceParts.length; i++) {
		thisPart = namespaceParts[i];
		parentNamespace = addNamespaceToObject(parentNamespace, thisPart);
	}
}

// ------------------------------------
// CODEBOX.consts

CODEBOX.addNamespace('consts');
CODEBOX.consts.assert = false;
CODEBOX.consts.dialogOnAssert = true;

// ------------------------------------
// CODEBOX.state

CODEBOX.addNamespace('state');
CODEBOX.state.xmlHttpNotSupported = false;

CODEBOX.assert = function( expression, msg, location ){
	if (CODEBOX.consts.assert){
		if (!expression){
			var errMsg = 'ASSERTION FAILED';
			if (msg){
				errMsg += ': ' + msg;
				if (location){
					errMsg += ' at ' + location; 
				}
			}
			if (CODEBOX.consts.dialogOnAssert){
				alert(errMsg);
			}
			throw new Error(errMsg);
		}
	}
}

CODEBOX.get = function(obj, property, optional) {
	var value = obj[property];
	CODEBOX.assert( optional || (value !== undefined), 'No ' + property + ' member found in ' + obj + ' object' );
	return value;
}

// ------------------------------------
// CODEBOX.dom

CODEBOX.addNamespace('dom');

CODEBOX.dom.get = function(id, optional){
	var element = document.getElementById(id);
	if (!element && !optional){
		throw new Error('No element with id=' + id + ' was found');
	}
	return element;
}

CODEBOX.dom.escapeEntities = function (text){
	CODEBOX.assert(typeof text == 'string', "Expected text to be a string parameter");
	return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/ /g,'&nbsp;');
}

CODEBOX.dom.addEventHandler = function( element, eventName, handler ){
	if (typeof element == 'string'){
		if(element=='document'){
			element = document;	
		} else {
		 // if 'element' is a string then assume it's the id of the element we need
			element = CODEBOX.dom.get(element);	
		}
	} 

	CODEBOX.assert(typeof eventName == 'string', "Expected eventName to be a string parameter");
	CODEBOX.assert(eventName.length > 2, "The eventName parameter of '" + eventName + "' was too short to be valid.");
			
	if (eventName.substring(0,2)==='on'){
	 // if the eventName parameter starts with the characters 'on' then remove them
		eventName = eventName.substring(2);
	}

	CODEBOX.assert(typeof handler == 'function');
	
	if (element.attachEvent){
	 // IE only
	 	element.attachEvent('on' + eventName, handler)
	
	} else {
	 // Non-IE browsers
	 	element.addEventListener(eventName, handler, false);
	}
	
}

CODEBOX.dom.getAbsolutePosn = function(element){
	var x=0, y=0;
	if (element.offsetParent) {
		x = element.offsetLeft;
		y = element.offsetTop;
		while (element = element.offsetParent) {
			x += element.offsetLeft;
			y += element.offsetTop;
		}
	}
	return { 'x' : x, 'y' : y };
};


