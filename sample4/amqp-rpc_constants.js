/**
 * constants for amqp-rpc plugin
 *
 * Date: 2016-05-20 21:50
 * Author: psnail
 */

'use strict';
var ServiceTypeConstants = {
    serviceType: 9903,
};

var AnnotationConstants = {
};

var PluginConstants = {
    endPoint: 'rabbitmq',
    destinationId: 'rabbitmq',
};

module.exports.ServiceTypeConstants = ServiceTypeConstants;
module.exports.AnnotationConstants = AnnotationConstants;
module.exports.PluginConstants = PluginConstants;
