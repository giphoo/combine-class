var _ = require("lodash");

var Class = module.exports = function Class(name, constructor){
    //make a new constructor
    var newClass = function(/*constructor arguments*/){
        return newClass.$new(this, arguments);
    };

    _defineReadOnly(newClass, "name", name);
    _defineReadOnly(newClass, "$Supers", [Class]);

    Class.$buildInherit.call(newClass);

    newClass.defineReadOnly("$constructor", constructor);
    newClass.prototype.defineReadOnly("constructor", newClass);

    return newClass;
};

//base static methods
Class.$FIXED_INHERIT_NUMBER = 1;
Class.extends = function(){
    var Supers = this.$Supers;
    if(Supers.length > this.$FIXED_INHERIT_NUMBER){
        Supers.splice(this.$FIXED_INHERIT_NUMBER);
    }
    for(var Super of arguments)
        Supers.push(Super);

    return this;
};
Class.instanceOf = function(parentClass){
    return (function checkSupers(curClass){
        if(_.isArray(curClass.$Supers)) for(var Super of curClass.$Supers){
            if(curClass && (parentClass === Super || checkSupers(Super))) return true;
        }
    })(this) || false;
};
Class.$new = function(_this, argus){
    _this = this.$create(_this);

    if(_.isFunction(this.$constructor))
        this.$constructor.apply(_this, argus);
    else if(_.get(this, "$Supers.length") > this.$FIXED_INHERIT_NUMBER)
        for(var i = this.$FIXED_INHERIT_NUMBER; i < this.$Supers.length; i++){
            this.$Supers[i].apply(_this, argus);
            if(this.$Supers[i] === Array){//fix length Property for Array
                Object.defineProperty(_this, "length", {
                    value: 0,
                    configurable: false,
                    writable: true
                })
            }
        }

    return _this;
};
Class.$create = function(_this){
    if(_this && _this.instanceOf && _this.instanceOf(Class)){
        return _this;
    }else{
        return Object.create(this.prototype);
    }
};
Class.$DEFAULT_PROXY_HANDLER = {
    getPropertyDescriptor: function(name){
        var prop;
        if (!this.target || _.isUndefined(prop = Object.getOwnPropertyDescriptor(this.target, name))){
            for (var Super of this.Supers) {
                Super = this.useSuperPrototype ? Super.prototype : Super;
                do {
                    if (!_.isUndefined(prop = Object.getOwnPropertyDescriptor(Super, name)))
                        break;
                } while (Super = Super.$__proto__ || Super.__proto__);
                if(!_.isUndefined(prop)) break;
            }
        }
        return prop;
    }
    , getPropertyNames: function() {
        var names = this.target ? Object.keys(this.target) : [];
        for (var Super of this.Supers)
            for (var name of Object.getPropertyNames(this.useSuperPrototype ? Super.prototype : Super))
                if (!~names.indexOf(name))
                    names.push(name);
        return names;
    }
    , getOwnPropertyDescriptor: function(name) {
        return Object.getOwnPropertyDescriptor(this.target, name)
    }
    , getOwnPropertyNames: function() {
        return this.target ? Object.getOwnPropertyNames(this.target) : [];
    }
    , defineProperty: function(name, prop) {
        Object.defineProperty(this.target, name, prop);
        return this.target
    }
    , 'delete': function(name) {
        //return delete this.target[name]
        return false;
    }
    , fix: function() {
        if (!Object.isFrozen(this.target)) return;
        var result = {};
        for (var name of Object.getOwnPropertyNames(this.target))
            result[name] = Object.getOwnPropertyDescriptor(this.target, name)
        return result
    }
};
Class.$buildInherit = function(handler){
    if(_.isPlainObject(handler)){
        handler.__proto__ = Class.$DEFAULT_PROXY_HANDLER;
    }else{
        handler = {
            __proto__: Class.$DEFAULT_PROXY_HANDLER
        }
    }
    _defineReadOnly(this, "$PROXY_HANDLER", handler);
    this.super_ = this._super = this.__proto__ = Proxy.create({
        target: this,
        Supers: this.$Supers,
        __proto__: handler
    });
    this.$__proto__ = Proxy.create({//it is a proxy tool to orginal __proto__
        Supers: this.$Supers,
        getOwnPropertyDescriptor: handler.getPropertyDescriptor,//proxy OwnGetter to allGetter
        __proto__: handler
    });
    if(this.prototype){
        this.prototype.super_ = this.prototype._super = this.prototype.__proto__ = Proxy.create({
            Supers: this.$Supers,
            useSuperPrototype: true,
            __proto__: handler
        });
        this.prototype.$__proto__ = Proxy.create({//it is a proxy tool to orginal __proto__
            Supers: this.$Supers,
            useSuperPrototype: true,
            getOwnPropertyDescriptor: handler.getPropertyDescriptor,//proxy OwnGetter to allGetter
            __proto__: handler
        });
    }
};

var ClassPrototype = Class.prototype;
ClassPrototype.instanceOf = function(parentClass){
    return this.constructor.instanceOf(parentClass);
};
ClassPrototype.defineReadOnly = Class.defineReadOnly = function(name, value){
    return _defineReadOnly(this, name, value);
};

function _defineReadOnly(obj, name, value){
    Object.defineProperty(obj, name, {
        value: value,
        enumerable: false,
        configurable: true,
        writable: false
    });
    return value;
}