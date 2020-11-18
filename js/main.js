(function() {

	var docElem = window.document.documentElement,
		// transition end event name
		transEndEventNames = { 'WebkitTransition': 'webkitTransitionEnd', 'MozTransition': 'transitionend', 'OTransition': 'oTransitionEnd', 'msTransition': 'MSTransitionEnd', 'transition': 'transitionend' },
		transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ];

	function scrollX() { return window.pageXOffset || docElem.scrollLeft; }
	function scrollY() { return window.pageYOffset || docElem.scrollTop; }
	function getOffset(el) {
		var offset = el.getBoundingClientRect();
		return { top : offset.top + scrollY(), left : offset.left + scrollX() };
	}

	function dragMoveListener(event) {
		var target = event.target,
			// keep the dragged position in the data-x/data-y attributes
			x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
			y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

		target.style.transform = target.style.webkitTransform = 'translate(' + x + 'px, ' + y + 'px)';
		target.style.zIndex = 10000;

		target.setAttribute('data-x', x);
		target.setAttribute('data-y', y);
	}

	function revertDraggable(el) {
		el.style.transform = el.style.webkitTransform = 'none';
		el.style.zIndex = 1;
		el.setAttribute('data-x', 0);
		el.setAttribute('data-y', 0);
	}

	function init() {
		document.querySelector('button.info-close').addEventListener('click', function() {
			var info = document.querySelector('.info-wrap');
			info.parentNode.removeChild(info);
		});

		interact('.drag-element').draggable({

			inertia: true,
			// call this function on every dragmove event
			onmove: dragMoveListener,
			onend: function (event) {
				if(!classesBases.has(event.target, 'drag-element--dropped') && !classesBases.has(event.target, 'drag-element--dropped-text')) {
					revertDraggable(event.target);
				}
			}
		});
//Paint area:
		interact('.paint-area').dropzone({
			// This will accept only those  elements which have this matching CSS selector
			accept: '.drag-element',
			overlap: 0.75,
			ondragenter: function (event) {
				classesBases.add(event.target, 'paint-area--highlight');
			},
			ondragleave: function (event) {
				classesBases.remove(event.target, 'paint-area--highlight');
			},
			ondrop: function (event) {
				var type = 'area';
				if(classesBases.has(event.target, 'paint-area--text')) {
					type = 'text';
				}

				var draggableElement = event.relatedTarget;

				classesBases.add(draggableElement, type === 'text' ? 'drag-element--dropped-text' : 'drag-element--dropped');

				var onEndTransCallbackFn = function(ev) {
					this.removeEventListener( transEndEventName, onEndTransCallbackFn );
					if( type === 'area' ) {
						paintArea(event.dragEvent, event.target, draggableElement.getAttribute('data-color'));
					}
					setTimeout(function() {
						revertDraggable(draggableElement);
						classesBases.remove(draggableElement, type === 'text' ? 'drag-element--dropped-text' : 'drag-element--dropped');
					}, type === 'text' ? 0 : 250);
				};
				if( type === 'text' ) {
					paintArea(event.dragEvent, event.target, draggableElement.getAttribute('data-color'));
				}
				draggableElement.querySelector('.drop').addEventListener(transEndEventName, onEndTransCallbackFn);
			},
			ondropdeactivate: function (event) {
				classesBases.remove(event.target, 'paint-area--highlight');
			}
		});

		// reset the color
		document.querySelector('button.reset-button').addEventListener('click', resetColors);
	}

	function paintArea(ev, el, color) {
		var type = 'area';
		if(classesBases.has(el, 'paint-area--text')) {
			type = 'text';
		}

		if( type === 'area' ) {
			var dummy = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			dummy.setAttributeNS(null, 'version', '1.1');
			dummy.setAttributeNS(null, 'width', '100%');
			dummy.setAttributeNS(null, 'height', '100%');
			dummy.setAttributeNS(null, 'class', 'paint');

			var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
			g.setAttributeNS(null, 'transform', 'translate(' + Number(ev.pageX - getOffset(el).left) + ', ' + Number(ev.pageY - getOffset(el).top) + ')');

			var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			circle.setAttributeNS(null, 'cx', 0);
			circle.setAttributeNS(null, 'cy', 0);
			circle.setAttributeNS(null, 'r', Math.sqrt(Math.pow(el.offsetWidth,2) + Math.pow(el.offsetHeight,2)));
			circle.setAttributeNS(null, 'fill', color);

			dummy.appendChild(g);
			g.appendChild(circle);
			el.appendChild(dummy);
		}

		setTimeout(function() {
			classesBases.add(el, 'paint--active');

			if( type === 'text' ) {
				el.style.color = color;
				var onEndTransCallbackFn = function(ev) {
					if( ev.target != this ) return;
					this.removeEventListener( transEndEventName, onEndTransCallbackFn );
					classesBases.remove(el, 'paint--active');
				};

				el.addEventListener(transEndEventName, onEndTransCallbackFn);
			}
			else {
				var onEndTransCallbackFn = function(event) {
					if( event.target != this || event.propertyName === 'fill-opacity' ) return;
					this.removeEventListener(transEndEventName, onEndTransCallbackFn);
					el.style.backgroundColor = color;

					el.removeChild(dummy);

					setTimeout(function() { classesBases.remove(el, 'paint--active'); }, 25);
				};

				circle.addEventListener(transEndEventName, onEndTransCallbackFn);
			}
		}, 25);
	}

	function resetColors() {
		[].slice.call(document.querySelectorAll('.paint-area')).forEach(function(el) {
			el.style[classesBases.has(el, 'paint-area--text') ? 'color' : 'background-color'] = '';
		});
	}

	init();

})();