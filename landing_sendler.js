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

LandingSendler.prototype.init = function () {
	var lsForms = document.getElementsByClassName('landing-sendler-form');
	if (!lsForms.length) {
		lsForms = document.getElementsByTagName('form');
	}
	this.addFormListeners(lsForms, this);
}

LandingSendler.prototype.addFormListeners = function (forms, _this) {
	for (var i = 0; i < forms.length; i++) {
		forms[i].addEventListener('submit', function (event) {
			_this.submitFormHandler(event, _this);
		});
	}
}

LandingSendler.prototype.submitFormHandler = function (event, _this) {
	var form = event.target;
	if (form.elements.lsToken) var lsToken = form.elements.lsToken.value;
	else console.warn('Landing Sendler: Скрытый инпут с токеном не найден.');

	var lsFields = form.getElementsByClassName('landing-sendler-field');
	if (!lsFields.length) lsFields = form.elements;
	var formName = form.hasAttribute('data-ls-form-name') ? form.getAttribute('data-ls-form-name') : form.name || 'noName',
		tgData = _this.mapTgData(lsFields);

	this.submitData(lsToken, { formName, fields: tgData });
}

LandingSendler.prototype.mapTgData = function (fields) {
	var results = [];
	var fields = this.prepareFields(fields);
	console.log(fields);

	for (var i = 0; i < fields.length; i++) {
		var fieldValue = this.formatField(fields[i]);
		if (fieldValue) {
			results.push({
				caption: this.getCaption(fields[i], i),
				value: fieldValue
			});
		}
	}

	return results;
}

LandingSendler.prototype.prepareFields = function (fields) {
	var prepared = [],
		inputNames = [],
		inputName = '';
	for (var i = 0; i < fields.length; i++) {
		if (fields[i].name !== 'lsToken') {
			var tagname = fields[i].tagName.toLowerCase();
			if (tagname === 'input') {
				switch (fields[i].type) {
					case 'text':
					case 'hidden':
						prepared.push(fields[i]);
						break;
					case 'checkbox':
						inputName = fields[i].name;
						if (inputName.length) {
							if (!~inputNames.indexOf(inputName)) {
								var checkboxGroup = fields[inputName];
								prepared.push(checkboxGroup);
								inputNames.push(inputName);
							}
						} else {
							prepared.push(fields[i]);
						}
						break;
					case 'radio':
						inputName = fields[i].name;
						if (inputName.length) {
							if (!~inputNames.indexOf(inputName)) {
								var radioGroup = fields[inputName];
								prepared.push(radioGroup);
								inputNames.push(inputName);
							}
						} else {
							prepared.push(fields[i]);
						}
						break;
					default:
						break;
				}
			}
		}
	}

	return prepared;
}

LandingSendler.prototype.formatField = function (field) {
	var tagname = field.length ? field[0].tagName.toLowerCase() : field.tagName.toLowerCase(),
		fieldType = field.length ? field[0].type : field.type;
	console.log(tagname);
	if (tagname === 'input') {
		switch (fieldType) {
			case 'text':
			case 'hidden':
				return field.length ? field[0].value.trim() : field.value.trim();
				break;
			case 'checkbox':
				var checkboxes = '';
				for (var i = 0; i < field.length; i++) {
					if (field[i].checked) checkboxes += field[i].value + '; '
				}
				return checkboxes;
				break;
			case 'radio':
				return field.value.trim();
				break;
			default:
				return false;
		}
	} else {
		return false;
	}
}

LandingSendler.prototype.getCaption = function (field, num) {
	var caption = '';
	if (field.length) {
		caption = field[0].hasAttribute('data-ls-caption') ? field[0].getAttribute('data-ls-caption') : field[0].name.length ? field[0].name : '' + num;
	} else {
		caption = field.hasAttribute('data-ls-caption') ? field.getAttribute('data-ls-caption') : field.name.length ? field.name : '' + num;
	}
	return caption;
}

LandingSendler.prototype.submitData = function (token, data) {
	console.log('submitData', token, data);
	var body = { lsToken: token, data: data };
	var bodyStr = JSON.stringify(body);
	var xhr = new XMLHttpRequest();
	xhr.timeout = 20000;
	xhr.open('POST', '/api/sendform', true);
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');

	xhr.onreadystatechange = function () {
		if (xhr.readyState != 4) return;
		if (xhr.status == 200) {
			var res = JSON.parse(xhr.response);
			if (!res.success)
				console.error('Landing Sendler Error: ' + res.error);
		}
	}

	xhr.send(bodyStr);
}