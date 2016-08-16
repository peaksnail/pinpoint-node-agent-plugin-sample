/**
 *
 * https module wrap plugin sample
 *
 * Date: 2016-05-16 23:00
 * Author: psnail
 *
 */

'use strict';
var interceptor = require('../../../commons/trace/method_interceptor.js');
var PinpointMetaData = require('../../../utils/constants.js').PinpointMetaData;
var ServiceTypeConstants = require('./https_constants.js').ServiceTypeConstants;
var TraceId = require('../../../commons/trace/trace_id.js');
var TraceContext = require('../../../commons/trace/trace_context.js').TraceContextFactory;


var wrap = function (https) {

    var original_request = https.request;
    var original_get = https.get;

    function https0get (original, proxy, argument) {
    
        var options = arguments[0];
        var original_callback = arguments[1];


        //first get pinpoint trace metadata from request
        var pinpointMetaData = options[PinpointMetaData.PINPOINT_METADATA];
        var traceId = undefined;
        //remote node request is traced
        if (pinpointMetaData !== undefined) {
            var transactionId = pinpointMetaData[PinpointMetaData.TRANSACTION_ID];
            var spanId = pinpointMetaData[PinpointMetaData.SPAN_ID];
            var parentSpanId = pinpointMetaData[PinpointMetaData.PARENT_SPAN_ID];
            var flag = pinpointMetaData[PinpointMetaData.FLAG];
            traceId = new TraceId(transactionId, parentSpanId, spanId, flag);
        } else {
        //remote node request is not traced
            traceId = undefined;
        }

        //start new trace,and pass the parent span info
        var traceContext = TraceContextFactory();
        var spanRecorder = traceContext.newTraceobject(traceId); 
        spanRecorder.recordRpcname(options.path);
        spanRecorder.recordApiId('https.get');
        spanRecorder.recordServiceType(ServiceTypeConstants.serviceType);
        //record needed info if remote is traced
        if (pinpointMetaData !== undefined) {
       		spanRecorder.recordParentApplication(pinpointMetaData[PinpointMetaData.PARENT_APPLICATION_NAME], pinpointMetaData[PinpointMetaData.PARENT_APPLICATION_TYPE]);
            spanRecorder.recordEndPoint(pinpointMetaData[PinpointMetaData.ENDPOINT]);
            spanRecorder.recordRemoteAddress(pinpointMetadata[PinpointMetadata.REMOTEADDRESS]);
            spanRecorder.recordAcceptorHost(pinpointMetadata[PinpointMetadata.ACCEPTORHOST]); 
        }


        var args = [options, original_callback];
        var ret = original.apply(proxy, args);
        traceContext.endTraceObject();
        return ret;
    }

    https.get = interceptor(original_get, https0get);
    return https;
};


module.exports = wrap;
