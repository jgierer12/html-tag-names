/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module html-tag-names:script:build
 * @fileoverview Crawl the table of tag-names.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var cheerio = require('cheerio');
var bail = require('bail');
var list = require('..');

/*
 * Constants.
 */

var HTTPS = 'https://';
var PREFIX = 'elements-3:';

/*
 * Input / output locations.
 */

var w3c = 'http://w3c.github.io/elements-of-html/';
var whatwg = 'https://html.spec.whatwg.org/multipage/indices.html#elements-3';
var output = path.join(__dirname, '..', 'index.json');

var count = 0;

/**
 * Write.
 */
function done() {
    count++;

    if (count === 2) {
        fs.writeFile(output, JSON.stringify(list.sort(), 0, 2) + '\n', bail);
    }
}

/**
 * Load.
 *
 * @param {string} url - Resource to crawl.
 * @param {Function} callback - Invoked with document.
 */
function load(url, callback) {
    var lib = url.slice(0, HTTPS.length) === HTTPS ? https : http;

    lib.get(url, function (res, err) {
        var value = '';

        if (err) {
            return callback(err);
        }

        res
            .setEncoding('utf8')
            .on('data', function (buf) {
                value += buf;
            }).on('end', function () {
                return callback(null, value);
            });
    });
}

/*
 * Crawl W3C.
 */

load(w3c, function (err, doc) {
    if (err) {
        bail(err);
    }

    cheerio.load(doc)('[scope="row"] code').each(function () {
        var data = this.children[0].data;

        if (data && !/\s/.test(data) && list.indexOf(data) === -1) {
            list.push(data);
        }
    });

    done();
});

/*
 * Crawl WHATWG.
 */

load(whatwg, function (err, doc) {
    if (err) {
        bail(err);
    }

    cheerio
        .load(doc)('tbody th code')
        .each(function () {
            var id = this.attribs.id;
            var child = this.children[0].children;
            var data = child && child[0] && child[0].data;

            if (
                id &&
                id.slice(0, PREFIX.length) === PREFIX &&
                list.indexOf(data) === -1
            ) {
                list.push(data);
            }
        });

    done();
});