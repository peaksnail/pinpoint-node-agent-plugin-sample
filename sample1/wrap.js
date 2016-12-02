/**
 *
 * https module wrap
 *
 * Date: 2016-05-16 23:00
 * Author: psnail
 *
 */

'use strict';
var interceptor = require('../../../commons/trace/method_interceptor.js');
var PinpointNodejsAgent = global.PinpointNodejsAgent;
var ServiceTypeConstants = require('./https_constants.js').ServiceTypeConstants;
var TraceContext = require('../../../commons/trace/trace_context.js').TraceContextFactory;


var wrap = function (https) {

    var original_get = https.get;

    //define the wrap func
    //arguments
    //  original https.get instance
    //  proxy   original https.get === this
    //  argument https.get arguments
    function https0get (original, proxy, argument) {
    
        var options = argument[0];
        var original_callback = argument[1];

        //start new transaction
        var traceContext = TraceContextFactory();
        if(!traceContext){
            //not sampled, return the original func
            return original.apply(proxy, argument);
        }
        //create current span record and set span detail info
        var spanRecorder = traceContext.newTraceObject();
        spanRecorder.recordRpcName(options.path);
        spanRecorder.recordServiceType(ServiceTypeConstants.serviceType);
        spanRecorder.recordApiId('https.get');

        var ret = original.apply(proxy, argument);

        //end current trace
        traceContext.endTraceObject();
        return ret;
    }

    //interceptor the func
    //arguments
    //  https.get instance
    //  wrap func
    https.get = interceptor(original_get, https0get);


    return https;
};


module.exports = wrap;
