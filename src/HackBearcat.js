// Qiang Yiting:
// This snippet hacks the bearcats: bearcat don't support ES6 beans, so the hack is to replace 
// it's BeanFactory.doCreateBean() to support that.
/* eslint brace-style: 'off' */
/* eslint 'new-cap': 'off' */
/* eslint 'no-var': 'off' */
/* eslint 'max-statements': 'off' */
/* eslint 'complexity': 'off' */
/* eslint 'no-process-env': 'off' */
/* eslint 'no-prototype-builtins': 'off' */
/* eslint 'block-scoped-var': 'off' */
/* eslint 'max-depth': 'off' */
/* eslint 'no-redeclare': 'off' */

var BeanFactory = require('bearcat/lib/beans/beanFactory');
var Constant = require('bearcat/lib/util/constant');
var Utils = require('bearcat/lib/util/utils');
var MetaUtil = require('bearcat/lib/util/metaUtil');
const logger = require('./Logger').create('hack_bearcat');


BeanFactory.prototype.doCreateBean = function(beanName) {
    var beanDefinition = this.getBeanDefinition(beanName);

    if (!beanDefinition) {
        return null;
    }

    if (beanDefinition.hasFactoryBean()) {
        return this.getBeanFromFactoryBean.apply(this, arguments);
    }

    var argsOn = beanDefinition.getArgsOn();
    var propsOn = beanDefinition.getPropsOn();
    var func = this.getBeanFunction(beanName);
    if (!func) {
        return null;
    }

    var dependsBeans = this.getDependsBeanValues(argsOn, arguments);

    // Hack by Qiang Yiting:
    // 
    // original code: 
    // var dependsApplyArgs = this.getDependsApplyArgs(dependsBeans);
    // var beanObject = Object.create(func.prototype);
    // func.apply(beanObject, dependsApplyArgs);
    //
    // new code begin----------------------------------------------------------
    var beanObject = new func(); // for simplicity, don't support inject by constructor args
    // new code end------------------------------------------------------------

    dependsBeans = this.getDependsBeanValues(propsOn);
    if (Utils.checkArray(dependsBeans)) {
        for (var i = 0; i < dependsBeans.length; i++) {
            var wbean = dependsBeans[i];
            var name = wbean.getName();
            if (wbean.getDependType() === Constant.DEPEND_TYPE_BEAN) {
                beanObject[name] = wbean.getBean();
            } else if (wbean.getDependType() === Constant.DEPEND_TYPE_VALUE) {
                beanObject[name] = wbean.getValue();
            }
            // no this case
            // else if (wbean.getDependType() === Constant.DEPEND_TYPE_VAR) {
            // beanObject[name] = wbean.getValueOnce();
            // } 
            else {
                // Constant.DEPEND_TYPE_ERROR
            }
        }
    }

    return beanObject;
}


MetaUtil.resolveFuncAnnotation = function(func, fp, force) {
    var funcString = func.toString();

    if (process.env.LOADER_BIN === 'on') {
        force = true;
    }

    if (this.metaCache[funcString] && !force) {
        return this.metaCache[funcString];
    }

    var funcArgsString = funcString.match(Constant.FUNC_ARGS_REGEXP);

    if (funcArgsString) {
        funcArgsString = funcArgsString[1];
    } else {
        funcArgsString = "";
    }

    var funcArgs = [];

    if (funcArgsString) {
        funcArgs = funcArgsString.split(',');
    }

    var meta = {};
    var props = [];
    var args = [];
    var attributes = [];

    var funcProps = null;

    if (funcArgs.length || process.env.BEARCAT_FUNCTION_STRING) {
        // if constructor function have arguments or setup BEARCAT_FUNCTION_STRING flag
        // use funcString to resolve $ props
        funcString = MetaUtil.resolveFuncComment(funcString);
        funcProps = MetaUtil.resolvePropsFromFuncString(funcString, funcArgsString);
    } else {
        // use new to resolve $ props directly to support dynamic $ prefix attributes
        // try catch the error, when dependency is not ready when started
        try {
            funcProps = new func();
        } catch (e) {
            logger.fatal(e); //qiangyiting: should log the error, otherwise, the original error is lost and will be confusing for developer
            return;
        }
    }

    for (var funcKey in funcProps) {
        // prototype attribute must be prefixed with $, other attributes will be ignored 
        if (!funcProps.hasOwnProperty(funcKey) && !MetaUtil.checkFuncAnnotation(funcKey)) {
            continue;
        }

        var value = funcProps[funcKey];

        // ignore function value
        if (Utils.checkFunction(value)) {
            continue;
        }

        if (MetaUtil.checkFuncAnnotation(funcKey)) {
            var key = funcKey.substr(1);
            if (MetaUtil.checkInMetaProps(funcKey)) {
                if (key === Constant.META_AOP && funcProps[funcKey] === true) {
                    meta[key] = this.resolvePrototypeAnnotation(func);
                } else {
                    if (key === Constant.META_ID) {
                        if (MetaUtil.checkInMetaProps(value, true)) {
                            logger.warn('bean id value must not use bearcat special bean attributes: %s', value);
                            return;
                        }
                    }
                    meta[key] = value;
                }
            } else {
                if (!MetaUtil.checkInFuncArgs(funcKey, funcArgs)) {
                    if (MetaUtil.checkFuncPropsValue(funcKey)) {
                        props.push({
                            name: funcKey,
                            value: value
                        });
                    } else if (MetaUtil.checkFuncPropsType(funcKey)) {
                        props.push({
                            name: funcKey,
                            type: value
                        });
                    } else if (MetaUtil.checkFuncPropsNamespace(funcKey)) {
                        props.push({
                            name: funcKey,
                            ref: value
                        });
                    } else {
                        props.push({
                            name: funcKey,
                            ref: key
                        });
                    }
                }
            }
            continue;
        } else if (MetaUtil.checkFuncPropsConfigValue(value)) {
            // this.num = "${car.num}"; placeholder
            props.push({
                name: funcKey,
                value: value
            });
        } else if (MetaUtil.checkFuncValueAnnotation(value)) {
            // this.num = "$type:Number"; model attribute
            attributes.push({
                name: funcKey,
                value: value
            });
        }
    }

    //delete funcProps; //Parsing error: Deleting local variable in strict mode

    if (props.length) {
        meta['props'] = props;
    }

    for (var i = 0; i < funcArgs.length; i++) {
        var funcArg = funcArgs[i].trim();
        if (!funcArg) {
            continue;
        }

        var key = funcArg.substr(1);
        if (MetaUtil.checkFuncAnnotation(funcArg)) {
            args.push({
                name: funcArg,
                ref: key
            });
        } else {
            // not start with $, treat it as a type injection
            args.push({
                name: funcArg,
                type: "Object"
            });
        }
    }

    if (args.length) {
        meta['args'] = args;
    }

    if (attributes.length) {
        meta['attributes'] = attributes;
    }

    meta['func'] = func;
    if (fp) {
        meta['fpath'] = require('path').resolve(process.cwd(), fp);
    }

    var id = meta.id;
    if (meta.id) {
        id = meta.id;
    } else if (meta.mid) {
        id = meta.mid + Constant.BEAN_SPECIAL_MODEL;
    } else if (meta.cid) {
        id = meta.cid + Constant.BEAN_SPECIAL_CONSTRAINT;
    } else {
        // must have id
    }

    if (id) {
        meta['id'] = id;
    }

    this.metaCache[funcString] = meta;
    return meta;
}