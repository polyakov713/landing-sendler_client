(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
			(global.landingSendler = factory(true));
}(this, function (isScript) {
	'use strict';
	return new LandingSendler(isScript);
}));

function LandingSendler(isScript) {
	if (isScript) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', this.init);
		} else {
			this.init();
		}
	}
}

LandingSendler.prototype.init = function() {
	var lsForms = document.getElementsByClassName('landing-sendler-form');
	this.addFormListeners(lsForms, this);
}

LandingSendler.prototype.addFormListeners = function(forms, _this) {
	for (var i = 0; i < forms.length; i++ ) {
		forms[i].addEventListener('submit', function(event) {
			_this.submitFormHandler(event, _this);
		});
	}
}

LandingSendler.prototype.submitFormHandler = function (event, _this) {
	var form = event.target,
		lsToken = form.elements.lsToken.value,
		lsFields = form.getElementsByClassName('landing-sendler-field'),
		tgData = lsFields.length ? _this.mapTgData(lsFields, true) : _this.mapTgData(form.elements, false);
	
	this.submitData(lsToken, tgData);
}

LandingSendler.prototype.mapTgData = function (fields, ls) {
	var results = [];
	if(ls) {
		for (var i = 0; i < fields.length; i++) {
			results.push({
				caption: fields[i].hasAttribute('data-ls-caption') ? fields[i].getAttribute('data-ls-caption') : fields[i].name || '' + i,
				value: this.formatField(fields[i])
			});
		}
	} else {
		for (var i = 0; i < fields.length; i++) {
			if (fields[i].name !== 'lsToken' && fields[i].tagName.toLowerCase() !== 'button') {
				results.push({
					caption: fields[i].hasAttribute('data-ls-caption') ? fields[i].getAttribute('data-ls-caption') : fields[i].name || '' + i,
					value: this.formatField(fields[i])
				})
			}
		}
	}
	return results;
}

LandingSendler.prototype.formatField = function (field) {
	switch (field.tagName.toLowerCase()) {
		case 'input':
			return field.value.trim();
			break;
		default:
			return '';
			break;
	}
}

LandingSendler.prototype.submitData = function (token, data) {
	console.log('submitData', token, data);
	var body = { lsToken: token, data: data};
	var bodyStr = JSON.stringify(body);
	var xhr = new XMLHttpRequest();
	xhr.timeout = 20000;
	xhr.open('POST', '/api/sendform', true);
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');

	xhr.onreadystatechange = function () {
		if (xhr.readyState != 4) return;
		if (xhr.status == 200) {
			var res = JSON.parse(xhr.response);
			if(!res.success)
				console.error('Landing Sendler Error: ' + res.error);
		}
	}

	xhr.send(bodyStr);
}