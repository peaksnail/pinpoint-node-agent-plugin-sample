/**
 *
 * https module wrap
 *
 * Date: 2016-05-16 23:00
 * Author: psnail
 *
 */

'use strict';
var interceptor = require('../../../commons/trace/mehtod_interceptor.js');
var cls = require('../../../commons/cls');
var PinpointNodejsAgent = global.PinpointNodejsAgent;
var PinpointTraceMetaData = require('../../../utils/constants.js').PinpointTraceMetaData;
var ServiceTypeConstants = require('./https_constants.js').ServiceTypeConstants;
var TraceContext = require('../../../commons/trace/trace_context.js').TraceContextFactory;

var wrap = function (https) {

    var original_get = https.get;

    function https0get (original, proxy, argument) {
    
        var options = argument[0];
        var original_callback = argument[1];


        //first judge should new traceContext or not
        var traceContext = TraceContextFactory();
        if(!traceContext.hasInit()){
            //can not find traceContext so new TraceContext and create span
            var spanRecorder = traceContext.newTraceObject();
            spanRecorder.recordServiceType(ServiceTypeConstants.serviceType);
            spanRecorder.recordApiId('https.get');
            spanRecorder.recordRpcName(options.path);
        }else{
            //find traceContext and spanRecorder and call continueTraceObject() to record spanEvent
            var spanEventRecorder = traceContext.continueTraceObject();
            spanEventRecorder.recordApiId('https.get');
            spanEventRecorder.recordServiceType(ServiceTypeConstants.serviceType);
        }

        //if callback is the last method called,just edit callback
        function callback () {
             
            var spanEventRecorder = traceContext.continueTraceObject();
            spanEventRecorder.recordApiId(TraceContext.getCallerFunctionName());
            spanEventRecorder.recordServiceType(ServiceTypeConstants.serviceType);
            original_callback(this, arguments);
            // if there has error,you should record error
            if (arguments[0] instanceof Error) {
                traceContext.recordException(arguments[0]);
            }
            //end current trace
            traceContext.endTraceObject();
        }

        //bind the callback, that the callback can get the context
        var ns = cls.getNamespace(PinpointTraceMetaData.TRACE_CONTEXT);
        var cb = ns.bind(callback);
        var args = [options, cb];
        var ret = original.apply(proxy, args);
        //end current trace
        traceContext.endTraceObject();
        return ret;
    }
    https.get = interceptor(original_get, https0get);

    return https;
};


module.exports = wrap;
