/*
** Module dependencies
*/
var _ = require('lodash');
var ns = require('./namespaces');
var debug = require('debug')('iso19139');


/*
** Definitions
*/
var definitions = {

    Main: {
        './/gmd:identificationInfo//gmd:citation//gmd:title': 'title',
        './/gmd:identificationInfo//gmd:abstract': 'abstract',
        './/gmd:fileIdentifier': 'fileIdentifier',
        './/gmd:identificationInfo//gmd:identifier': 'identifier',
        './/gmd:identificationInfo//gmd:language': 'language',
        './/gmd:dataQualityInfo//gmd:lineage//gmd:statement': 'lineage',
        './/gmd:hierarchyLevel/gmd:MD_ScopeCode/@codeListValue': 'type',
        './/gmd:identificationInfo//gmd:MD_SpatialRepresentationTypeCode/@codeListValue': 'representationType',
        './/gmd:dateStamp': '_updated',

        './/gmd:identificationInfo//gmd:citation//gmd:date': { dest: 'history', type: 'Date', multi: true },
        './/gmd:identificationInfo//gmd:keyword': { dest: 'keywords', multi: true },
        './/gmd:identificationInfo//gmd:topicCategory': { dest: 'topicCategories', multi: true },

        './/gmd:distributionInfo//gmd:transferOptions//gmd:onLine': { dest: 'onlineResources', type: 'Link', multi: true },
        './/gmd:contact': { dest: '_contacts', type: 'Contact', multi: true },
        './/gmd:identificationInfo//gmd:pointOfContact': { dest: 'contacts', type: 'Contact', multi: true },
        './/gmd:identificationInfo//gmd:graphicOverview': { dest: 'graphicOverviews', type: 'GraphicOverview', multi: true },

        // Service
        './/gmd:identificationInfo//srv:serviceType': 'serviceType',
        './/gmd:identificationInfo//srv:couplingType/*/@codeListValue': 'couplingType',
        './/gmd:identificationInfo//srv:coupledResource': { dest: 'coupledResources', type: 'CoupledResource', multi: true }
    },

    Link: {
        './/gmd:linkage': 'link',
        './/gmd:protocol': 'protocol',
        './/gmd:description': 'description',
        './/gmd:name': 'name'
    },

    Contact: {
        './/gmd:organisationName': 'organizationName',
        './/gmd:individualName': 'individualName',
        './/gmd:positionName': 'positionName',
        './/gmd:contactInfo//gmd:phone//gmd:voice': 'phone',
        './/gmd:contactInfo//gmd:phone//gmd:facsimile': 'fax',
        './/gmd:contactInfo//gmd:address//gmd:electronicMailAddress': 'email',
        './/gmd:contactInfo//gmd:address//gmd:deliveryPoint': 'deliveryPoint',
        './/gmd:contactInfo//gmd:address//gmd:city': 'city',
        './/gmd:contactInfo//gmd:address//gmd:postalCode': 'postalCode',
        './/gmd:contactInfo//gmd:address//gmd:country': 'country',
        './/gmd:role/gmd:CI_RoleCode/@codeListValue': 'role'
    },

    GraphicOverview: {
        './/gmd:fileName': 'fileName',
        './/gmd:fileDescription': 'fileDescription',
        './/gmd:fileType': 'fileType'
    },

    Date: {
        './/gmd:date': 'date',
        './/gmd:dateType/gmd:CI_DateTypeCode/@codeListValue': 'type'
    },

    CoupledResource: {
        './/srv:operationName': 'operationName',
        './/srv:identifier': 'identifier',
        './/gco:ScopedName': 'scopedName'
    }

};


/*
** Helpers
*/
var buildObject, buildArray, buildTextValue;

buildTextValue = function(node) {
    if (!node) return undefined;
    var value;
    if (node.type() === 'attribute') value = node.value();
    if (node.type() === 'element') value = node.text();
    if (!value || value.length === 0) return undefined;
    return value;
};

buildArray = function(nodes, type) {
    if (!nodes || nodes.length === 0) return undefined;
    var result = [];
    nodes.forEach(function(node) {
        var value = type ? buildObject(node, type) : buildTextValue(node);
        if (value) result.push(value);
    });
    return result.length ? result : undefined;
};

buildObject = function(node, type) {
    var result = {};
    _.forEach(definitions[type], function(params, xpath) {
        if (_.isString(params)) params = { dest: params };
        var value;
        if (params.multi) value = buildArray(node.find(xpath, ns), params.type);
        else if (params.type) value = buildObject(node.get(xpath, ns), params.type);
        else value = buildTextValue(node.get(xpath, ns));
        if (value) result[params.dest] = value;
    });
    return _.size(result) ? result : undefined;
};


/*
** Methods
*/
function parse(xmlDoc, options) {
    options = options || {};

    var name = xmlDoc.name();
    var namespace = xmlDoc.namespace();

    if (name !== 'MD_Metadata' || namespace.href() !== ns.gmd) {
        debug('Unable to parse record (name: %s, namespace:%s: %s)', name, namespace.prefix(), namespace.href());
        return;
    }

    /*
    ** TODO
    ** Unique resource identifier ? identificationInfo/citation/identifier ! Attention code/codeSpace => merdique
    ** BBOX
    */

    var result = buildObject(xmlDoc, 'Main');
    if (result && options.keepXml) result._xml = xmlDoc;

    return result;
}


/*
** Exports
*/
module.exports = parse;
