
/*=============================================================================
	License:		MIT (http://opensource.org/licenses/mit-license.php)		
																				
	Description:	Knockout Dynamic Forms							
	Version:		2.0											
===============================================================================
*/

//Validation configurables
//More info: https://github.com/Knockout-Contrib/Knockout-Validation
//Fork of https://github.com/jansmolders86/knockout-dynamic-forms, adding support for multiple forms on a page

ko.validation.init({
    registerExtenders: true,
    messagesOnModified: true,
    errorsAsTitle: true,                 // enables/disables showing of errors as title attribute of the target element.
    errorsAsTitleOnModified: false,                // shows the error when hovering the input field (decorateElement must be true)
    messageTemplate: null,
    insertMessages: true,                 // automatically inserts validation messages as <span></span>
    parseInputAttributes: false,                // parses the HTML5 validation attribute from a form element and adds that to the object
    writeInputAttributes: false,                // adds HTML5 input validation attributes to form elements that ko observable's are bound to
    decorateInputElement: false,                // false to keep backward compatibility
    decorateElementOnModified: true,                 // true to keep backward compatibility
    errorClass: null,                 // single class for error message and element
    errorElementClass: 'validationElement',  // class to decorate error element
    errorMessageClass: 'validationMessage',  // class to decorate error message
    allowHtmlMessages: false,                // allows HTML in validation messages
    grouping: {
        deep: false,                            //by default grouping is shallow
        observable: true,                             //and using observables
        live: false                             //react to changes to observableArrays if observable === true
    }
});

ko.dirtyFlag = function (root, isInitiallyDirty) {
    var result = function () { },
        _initialState = ko.observable(ko.toJSON(root)),
        _isInitiallyDirty = ko.observable(isInitiallyDirty);

    result.isDirty = ko.computed(function () {
        return _isInitiallyDirty() || _initialState() !== ko.toJSON(root);
    });

    result.reset = function () {
        _initialState(ko.toJSON(root));
        _isInitiallyDirty(false);
    };

    return result;
};

addEventListener('load', function () {
    doAjaxCall(JSONUrl, function (data) {
        var ajaxResult = JSON.parse(data);
        ko.applyBindings(new ViewModel(ajaxResult.Forms));
    });
});

// The fields on a form
function FormField(data) {
    var self = this;
    self.Name = ko.observable(data.Name).extend({ required: true });;
    self.Element = ko.observable(data.Element);
    self.Type = ko.observable(data.Type);
    self.Options = ko.observableArray(data.Options);
    self.Placeholder = ko.observable(data.Placeholder);
    if (Array.isArray(data.Value))
        self.Value = ko.observableArray(data.Value);
    else
        self.Value = ko.observable(data.Value).extend(data.Validation);
    self.HideElement = ko.observable(data.HideField.HideElement);
    self.HideCondition = ko.observable(data.HideField.HideCondition);
    if (self.Type() == 'checkbox') {
        self.Value.subscribe(function (nval) {
            console.log(nval);
        })
    }
}

// A form
function Form(data) {
    var self = this;
    self.Name = ko.observable(data.Name).extend({ required: true });
    self.FormFields = ko.observableArray(ko.utils.arrayMap(data.FormFields, function (item) {
        return new FormField(item);
    }));

    self.errors = ko.validation.group(this, {
        deep: true,
        observable: false
    });

    self.SaveForm = function () {
        for (var i = 0; i < self.FormFields().length; i++) {
            console.log(i);
            console.log(self.FormFields()[i].Value());
        }
        if (self.errors().length > 0) {
            self.errors.showAllMessages();
            return;
        }
        else {
            console.log('masuk else');
        }
    };

    self.HiddenElements = ko.observableArray([]);
    self.dirtyFlag = new ko.dirtyFlag(this);
    self.isDirty = ko.computed(function () {
        if (self.dirtyFlag.isDirty()) {

            var formFields = self.FormFields();

            for (var i = 0; i < formFields.length; i++) {

                var ElementValue = formFields[i].Value();
                var HideElement = formFields[i].HideElement();
                var HideCondition = formFields[i].HideCondition();

                if (HideElement !== "") {
                    for (var i = 0; i < formFields.length; i++) {
                        if (formFields[i].Name() === HideElement) {
                            if (ElementValue.match(HideCondition)) {
                                self.HiddenElements([HideElement]);
                            }
                        }
                    }
                }

            }
        }
    });

    //--Helper
    self.IsNullOrEmpty = function (param) {
        if (param) {
            if (param == '') return true;
            return false;
        }
        return true;
    }
}

function ViewModel(data) {
    var self = this;
    
    self.Forms = ko.observableArray(ko.utils.arrayMap(data, function (item) {
        return new Form(item);
    }));
}

function doAjaxCall(url, callback) {
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            callback(xmlhttp.responseText);
        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

