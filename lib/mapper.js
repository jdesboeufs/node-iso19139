/*
** Module dependencies
*/
var libxml = require('libxmljs');
var _ = require('lodash');
var ns = require('./namespaces');


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
        './/gmd:identificationInfo//srv:serviceType': 'serviceType',

        './/gmd:identificationInfo//gmd:keyword': { dest: 'keywords', multi: true },

        './/gmd:distributionInfo//gmd:transferOptions//gmd:onLine': { dest: 'onlineResources', type: 'Link', multi: true },
        './/gmd:contact': { dest: '_contacts', type: 'Contact', multi: true },
        './/gmd:identificationInfo//gmd:pointOfContact': { dest: 'contacts', type: 'Contact', multi: true }
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
    }

};


/*
** Helpers
*/
function ensureXml(xmlDoc) {
    if (_.isString(xmlDoc)) {
        xmlDoc = libxml.parseXmlString(xmlDoc, { noblanks: true });
    }
    return xmlDoc;
}

var buildObject, buildArray, buildTextValue;

buildTextValue = function(node) {
    if (!node) return null;
    var value;
    if (node.type() === 'attribute') value = node.value();
    if (node.type() === 'element') value = node.text();
    if (!value || value.length === 0) return null;
    return value;
};

buildArray = function(nodes, type) {
    if (!nodes || nodes.length === 0) return null;
    var result = [];
    nodes.forEach(function(node) {
        var value = type ? buildObject(node, type) : buildTextValue(node);
        if (value) result.push(value);
    });
    return result.length ? result : null;
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
    return _.size(result) ? result : null;
};


/*
** Methods
*/
function mapper(xmlDoc) {
    xmlDoc = ensureXml(xmlDoc);

    /*
    ** TODO
    ** Resource locator (distributionInfo)
    ** Unique resource identifier ? identificationInfo/citation/identifier ! Attention code/codeSpace => merdique
    ** Coupled resources for services
    ** Topic category
    ** Service type
    ** BBOX
    */

    return buildObject(xmlDoc, 'Main');
}


/*
** Exports
*/
module.exports = mapper;
