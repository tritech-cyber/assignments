CODEBOX.addNamespace('ipcalc');

CODEBOX.ipcalc.init = function (){
	var sliderXCoord = CODEBOX.dom.getAbsolutePosn( CODEBOX.dom.get('slider') ).x;
	var marker       = CODEBOX.dom.get('marker');
	var slider       = CODEBOX.dom.get('slider');
	var netmask      = CODEBOX.dom.get('netmask');
	var buttonPressed  = false;
	var ipAddressValid = validate();
	
	$(window).resize(function(){
		sliderXCoord = CODEBOX.dom.getAbsolutePosn( CODEBOX.dom.get('slider') ).x;
	});	
	
	function moveSlider(xCoord){
		if (xCoord < 10)  xCoord = 10;
		if (xCoord > 195) xCoord = 195;
		marker.style.left = ((xCoord - 10)+ 'px');
		var currentNetmaskValue = netmask.innerHTML;
		var newNetmaskValue = Math.floor((30 * (xCoord - 10) / 185) + 1);
		if ( currentNetmaskValue != newNetmaskValue){
			netmask.innerHTML = newNetmaskValue;
			refreshOutput();
		}
	}
	CODEBOX.dom.addEventHandler('o1', 'keyup', function(e){
		refreshOutput();
	});
	CODEBOX.dom.addEventHandler('o2', 'keyup', function(e){
		refreshOutput();
	});
	CODEBOX.dom.addEventHandler('o3', 'keyup', function(e){
		refreshOutput();
	});
	CODEBOX.dom.addEventHandler('o4', 'keyup', function(e){
		refreshOutput();
	});
	CODEBOX.dom.addEventHandler('slider', 'click', function(e){
		moveSlider(e.clientX - sliderXCoord);
	});
	CODEBOX.dom.addEventHandler('marker', 'mousedown', function(e){
		buttonPressed = true;
	});
	CODEBOX.dom.addEventHandler('marker', 'mouseup', function(e){
		buttonPressed = false;
	});
	CODEBOX.dom.addEventHandler('slider', 'mousemove', function(e){
		if (buttonPressed){
			moveSlider(e.clientX - sliderXCoord);
		}
	});
	CODEBOX.dom.addEventHandler('marker', 'touchstart', function(e){
		buttonPressed = true;
	});
	CODEBOX.dom.addEventHandler('marker', 'touchend', function(e){
		buttonPressed = false;
	});
	CODEBOX.dom.addEventHandler('slider', 'touchmove', function(e){
		if (buttonPressed){
			moveSlider(e.changedTouches[0].clientX - sliderXCoord);
		}
	});
	
	moveSlider(155);
	if (CODEBOX.dom.get('o1').value == '') CODEBOX.dom.get('o1').value = '192';
	if (CODEBOX.dom.get('o2').value == '') CODEBOX.dom.get('o2').value = '168';
	if (CODEBOX.dom.get('o3').value == '') CODEBOX.dom.get('o3').value = '1';
	if (CODEBOX.dom.get('o4').value == '') CODEBOX.dom.get('o4').value = '2';
	
	refreshOutput();
	CODEBOX.dom.get('o1').focus();

	function makeIpAddress(byte1, byte2, byte3, byte4){
		var ip = {};
		
		ip.print = function(){
			return byte1 + '.' + byte2 + '.' + byte3 + '.' + byte4;
		};
		
		ip.next = function(){
			if (byte4 < 255){
				byte4++;	
			} else if (byte3 < 255){
				byte4 = 0;
				byte3++;	
			} else if (byte2 < 255){
				byte4 = 0;
				byte3 = 0;
				byte2++;
			} else if (byte1 < 255){
				byte4 = 0;
				byte3 = 0;
				byte2 = 0;
				byte1++;
			} else {
				CODEBOX.assert(false);	
			}
		};
		
		ip.previous = function(){
			if (byte4 > 0){
				byte4--;	
			} else if (byte3 > 0){
				byte4 = 255;
				byte3--;	
			} else if (byte2 > 0){
				byte4 = 255;
				byte3 = 255;
				byte2--;
			} else if (byte1 > 0){
				byte4 = 255;
				byte3 = 255;
				byte2 = 255;
				byte1--;
			} else {
				CODEBOX.assert(false);	
			}
		};
		return ip;	
	}

	function refreshOutput(){
		if (validate()){
			calc(Number(CODEBOX.dom.get('o1').value), Number(CODEBOX.dom.get('o2').value), 
						Number(CODEBOX.dom.get('o3').value), Number(CODEBOX.dom.get('o4').value), 
						Number(CODEBOX.dom.get('netmask').innerHTML));
		} else {
			setOutput("<span class='outputValue'>Please enter a valid IP address</span>");
		}
	}
	function calc(o1, o2, o3, o4, nm){
		function output(values){
			var html = '<table>';
			for(var key in values){
				html += ('<tr><td class="codeBold">' + key + '</td><td class="codePlain">' + values[key] + '</td></tr>');
			}
			html += '</table>';
			setOutput(html);
		}
		
		var broadcastIp = makeBroadcast(o1, o2, o3, o4, nm);
		var broadcastAddress = broadcastIp.print();
		broadcastIp.previous();
		var maxHostAddress = broadcastIp.print();
		
		var networkIp   = makeNetwork(o1, o2, o3, o4, nm);
		var networkAddress = networkIp.print();
		networkIp.next();
		var minHostAddress = networkIp.print();
		
		if (maxHostAddress == networkAddress){
			maxHostAddress = '-';
		}
		if (minHostAddress == broadcastAddress){
			minHostAddress = '-';
		}
		
		output({
			'Subnet Netmask' :      makeNetmaskIp(nm),
			'Network' :             networkAddress  + '/' + nm,
			'Min Host' :            minHostAddress,
			'Max Host' :            maxHostAddress,
			'Broadcast Address' :   broadcastAddress,
			'Max Hosts on Subnet' : makeMaxHosts(nm)
		});
	}
	function makeMaxHosts(size){
		if (size > 31){
			return 0;	
		} else if (size == 1){
			return 2147483646;
		} else {
			return (1 << (32 - size)) - 2;
		}
	}
	function makeBroadcast(o1, o2, o3, o4, nm){
		var netmaskBytes = makeNetmaskBytes(nm);
		for(var i in netmaskBytes){
			netmaskBytes[i] = ~netmaskBytes[i];
		}
	
		return makeIpAddress(((o1 | netmaskBytes[0]) + 256), ((o2 | netmaskBytes[1]) + 256),
				((o3 | netmaskBytes[2]) + 256), ((o4 | netmaskBytes[3]) + 256));
	}
	function makeNetwork(o1, o2, o3, o4, nm){
		var nmBytes = makeNetmaskBytes(nm);
		
		var byte1 = nmBytes[0] & o1;
		var byte2 = nmBytes[1] & o2;
		var byte3 = nmBytes[2] & o3;
		var byte4 = nmBytes[3] & o4;
		
		return makeIpAddress(byte1, byte2, byte3, byte4);
	}
	function makeNetmaskIp(netmaskSize){
		var bytes = makeNetmaskBytes(netmaskSize);
		return makeIpAddress(bytes[0], bytes[1], bytes[2], bytes[3]).print();
	}
	function makeNetmaskBytes(size){
		function makeNetmaskByte(size){
			function makeByte(initVal){
					var value = 0;
					if (initVal){
						CODEBOX.assert(typeof initVal === 'number' && (initVal >= 0) && (initVal <= 255), 'Bad initVal');
						value = initVal;
					}
				
					var byte = {};
					
					byte.invert = function(){
						value = ~value;
					};
					
					byte.setBit = function(bitIndex, bitValue){
						CODEBOX.assert(bitIndex <= 7 && bitIndex >= 0, 'Invalid bitIndex value');		
						if (bitValue){
							value |= (1<<bitIndex);
						} else {
							value &= (255 - (1<<bitIndex));
						}
					}
				
					byte.getValue = function(){
						return value;	
					}
					
					return byte;	
				}			
			var byte = makeByte();
			
			if (size >= 8){
				return 255;	
			} else if (size <= 0){
				return 0;	
			} else {
				var byte = makeByte();
				
				for(var i=1; i <= size; i++){
					byte.setBit(8-i, 1);	
				}
				
				return byte.getValue();
			}
		}
		
		return [makeNetmaskByte(size), makeNetmaskByte(size-8), makeNetmaskByte(size-16), makeNetmaskByte(size-24)];
	}
	
	function setOutput(txt){
		CODEBOX.dom.get('output').innerHTML = txt;
	}
	function validate(){
		function validateBox(box, fnValidateValue){
			box.value = box.value.replace(/\s/g, '');
			if (fnValidateValue(box.value)){
				box.className =	'inputBox';
				return true;
			} else {
				box.className =	'inputBoxErr';
				return false;
			}
		}
		
		function validateOctet(octetValue){
			if (octetValue.match(/^[0-9]{1,3}$/)){
				var octetNum = Number(octetValue);
				return !isNaN(octetNum) && octetNum >=0 && octetNum <= 255;
			} else {
				return false;	
			}
		}
		
		var box1Ok    = validateBox(CODEBOX.dom.get('o1'), validateOctet);
		var box2Ok    = validateBox(CODEBOX.dom.get('o2'), validateOctet);
		var box3Ok    = validateBox(CODEBOX.dom.get('o3'), validateOctet);
		var box4Ok    = validateBox(CODEBOX.dom.get('o4'), validateOctet);
		
		return box1Ok && box2Ok && box3Ok && box4Ok;
	}
}
CODEBOX.ipcalc.init()
