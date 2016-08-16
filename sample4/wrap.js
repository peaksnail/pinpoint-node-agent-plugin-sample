/**
 *
 * amqp-rpc pinpoint agent plugin sample
 *
 * Date: 2016-06-21
 * Author: psnail
 *
 */

'use strict';
var interceptor = require('../../../commons/trace/method_interceptor.js');
var PinpointNodejsAgent = global.PinpointNodejsAgent;
var PinpointMetaData = require('../../../utils/constants.js').PinpointMetaData;
var PluginConstants = require('./amqp-rpc_constants.js').PluginConstants;
var ServiceTypeConstants = require('./amqp-rpc_constants.js').ServiceTypeConstants;
var TraceContext = require('../../../commons/trace/trace_context.js').TraceContextFactory;


var wrap = function (amqpRPC) {

    var original_amqpRPC = amqpRPC.amqpRPC;
    var original_amqpRPC_call = original_amqpRPC.prototype.call;
    //modify amqpRPC 
    function amqp1rpc0amqpRPC0call (original, proxy, argument) {

    	var cmd = argument[0];
		var params = argument[1];
		var original_callback = argument[2];
		var context = argument[3];
		var options = argument[4];

        if (params === undefined) {
            params = {};
        }
        var traceContext = TraceContextFactory();
        if (!traceContext.hasInit()) {
            var spanRecorder = traceContext.newTraceObject();
            spanRecorder.recordServiceType(ServiceTypeConstants.serviceType);
            spanRecorder.recordApiId(TraceContext.getCallerFunctionName());
            try{
                //try to record rpc name
                spanRecorder.recordRpcName(params.t);
            }catch(err){
                //do nothing
            }
        }

        //get nextSpanHeader for next node to continue
        //the nextSpanHeader record the nextSpanId and parentSpanId(current span id) and transactionId
        var metadata = spanRecorder.getNextSpanHeader()
        // you must pass these info below to another node that web can show normally
        metadata[PinpointMetaData.ENDPOINT] = PluginConstants.endPoint;
        metadata[PinpointMetaData.ACCEPTORHOST] = PluginConstants.destinationId;
        metadata[PinpointMetaData.REMOTEADDRESS] = PinpointNodejsAgent.agentIp;
        params[PinpointMetaData.PINPOINT_METADATA] = metadata;

        //for server continue
        //destinationId must be in spanEvent,so we should use spanEvent for continue
        var spanEventRecorder = traceContext.continueTraceObject();
        spanEventRecorder.recordApiId(TraceContext.getCallerFunctionName());
        spanEventRecorder.recordNextSpanId(spanRecorder.getNextSpanId());
        spanEventRecorder.recordServiceType(ServiceTypeConstants.serviceType);
        //you must record these info
        spanEventRecorder.recordEndPoint(PluginConstants.endPoint);
        spanEventRecorder.recordDestinationId(PluginConstants.destinationId);

   		//modify callback
   		function callback (ret) {
   		
   		    if (original_callback && (typeof original_callback) === 'function') {
   		        original_callback(ret);
                traceContext.endTraceObject();
   		    }
   		}

   		var args = [cmd, params, callback, context, options];
        try {
   		    var ret = original.apply(proxy, args);
            if ((original_callback === undefined) || (typeof original_callback) !== 'function') {
                traceContext.endTraceObject();
            } else {
                traceContext.endTraceObject();
            }
        } catch (err) {
            traceContext.recordException(err);
            traceContext.endTraceObject();
        }
   	}
	original_amqpRPC.prototype.call = interceptor(original_amqpRPC, amqp1rpc0amqpRPC0call);
    return amqpRPC;
};


module.exports = wrap;
