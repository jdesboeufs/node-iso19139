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

function mapKeywords(xmlDoc, dest) {
    var nodes = xmlDoc.find('.//gmd:identificationInfo//gmd:keyword', ns);
    if (nodes && nodes.length) {
        dest.keywords = [];
        _.forEach(nodes, function(node) {
            var keyword = node.text();
            if (keyword && keyword.length) dest.keywords.push(keyword);
        });
    }
}

function mapOnlineResources(xmlDoc, dest) {
    var nodes = xmlDoc.find('.//gmd:distributionInfo//gmd:transferOptions//gmd:onLine', ns);
    if (nodes && nodes.length) {
        dest.onlineResources = [];
        _.forEach(nodes, function(node) {
            var obj = {};
            mapFields(onlineResourceMapping, node, obj);
            if (obj.link) dest.onlineResources.push(obj);
        });
    }
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
    './/gmd:hierarchyLevel/gmd:MD_ScopeCode/@codeListValue': 'type',
    './/gmd:identificationInfo//gmd:MD_SpatialRepresentationTypeCode/@codeListValue': 'representationType'
};

var serviceMapping = {
    './/gmd:identificationInfo//srv:serviceType': 'serviceType'
};

var onlineResourceMapping = {
    './/gmd:linkage': 'link',
    './/gmd:protocol': 'protocol',
    './/gmd:description': 'description',
    './/gmd:name': 'name'
};

/*
** Methods
*/
function mapper(xmlDoc) {
    xmlDoc = ensureXml(xmlDoc);

    var resource = {};

    // Common
    mapFields(commonMapping, xmlDoc, resource);
    mapKeywords(xmlDoc, resource);
    mapOnlineResources(xmlDoc, resource);

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
    ** BBOX
    */

    return resource;
}


/*
** Exports
*/
module.exports = mapper;
