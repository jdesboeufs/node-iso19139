/*
** Module dependencies
*/
var libxml = require('libxmljs');
var _ = require('lodash');
var ns = require('./namespaces');


/*
** Helpers
*/
function ensureXml(xmlDoc) {
    if (_.isString(xmlDoc)) {
        xmlDoc = libxml.parseXmlString(xmlDoc, { noblanks: true });
    }
    return xmlDoc;
}

function mapFields(scheme, xmlDoc, dest) {
    _.forEach(scheme, function(fieldName, xpath) {
        var node = xmlDoc.get(xpath, ns), value;
        if (!node) return;
        if (node.type() === 'attribute') value = node.value();
        if (node.type() === 'element') value = node.text();
        if (value.length > 0) dest[fieldName] = value;
    });
}

/*
** Mappings
*/
var commonMapping = {
    './/gmd:identificationInfo//gmd:citation//gmd:title': 'title',
    './/gmd:identificationInfo//gmd:abstract': 'abstract',
    './/gmd:fileIdentifier': 'fileIdentifier',
    './/gmd:identificationInfo//gmd:identifier': 'identifier',
    './/gmd:identificationInfo//gmd:language': 'language',
    './/gmd:dataQualityInfo//gmd:lineage//gmd:statement': 'lineage',
    './/gmd:hierarchyLevel/gmd:MD_ScopeCode/@codeListValue': 'type'
};

var serviceMapping = {
    './/gmd:identificationInfo//srv:serviceType': 'serviceType'
};

/*
** Methods
*/
function mapper(xmlDoc) {
    xmlDoc = ensureXml(xmlDoc);

    var resource = {};

    // Common
    mapFields(commonMapping, xmlDoc, resource);

    // Service
    if (resource.type && resource.type === 'service') {
        mapFields(serviceMapping, xmlDoc, resource);
    }

    /*
    ** TODO
    ** Resource locator (distributionInfo)
    ** Unique resource identifier ? identificationInfo/citation/identifier ! Attention code/codeSpace => merdique
    ** Coupled resources for services
    ** Topic category
    ** Service type
    ** Keywords
    ** BBOX
    */

    return resource;
}


/*
** Exports
*/
module.exports = mapper;