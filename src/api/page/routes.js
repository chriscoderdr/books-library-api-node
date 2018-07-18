const Book = require('../models').book.Book;
const Page = require('../models').page.Page;
const Author = require('../models').author.Author;
const Router = require('router');
let config = require('../config').server.config;
const url = require('whatwg-url');
const util = require('../util');

/**
 * 
 * @param {Router} router 
 */
function setupRoutes(router) {
  router.get('/v1.0/book/:bookId/page', async (req, res) => {
    util.pagination(req);
    result = {};
    const bookId = req.params.bookId;
    const pagesResult = await Page.findAndCountAll({
      limit: req.top,
      offset: 1,
      where: {
        bookId: bookId
      }
    });
    result.value = pagesResult.rows.map((page, _, __) => {
      return {
        id: page.id,
        html: page.html,
        text: page.text
      }
    });
    if (pagesResult.count - req.skip > req.top) {
      let nextPageUrl = config.baseUrl + req.url + '?';
      nextPageUrl += 'skip=' + (req.skip + req.top);
      if (req.maxPageSize) {
        nextPageUrl += '&maxPageSize=' + req.maxPageSize
      }
      result.nextLink = nextPageUrl.toString();
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(result));
  });

  router.route('/v1.0/book/:bookId/page/:pageId')
    .get((req, res) => {
      const pageId = req.params.pageId;
      Page.findById(pageId).then((page) => {
        const pageResult = {
          id: page.id,
          text: page.text,
          html: page.html
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(pageResult));
      });
    });

  router.route('/v1.0/book/:bookId/page/:pageId/:format')
    .get((req, res) => {
      const pageId = req.params.pageId;
      const format = req.params.format;
      Page.findById(pageId).then((page) => {
        let response = null;
        let contentType = null;
        switch (format) {
          case 'html':
            response = page.html;
            contentType = 'text/html';
            break;
          case 'text':
            response = page.text;
            contentType = 'text/plain';
            break;
          default:
            response = page.text;
            contentType = 'text/plain';
            break;
        }
        res.setHeader('Content-Type', contentType + '; charset=utf-8');
        res.end(response);
      });
    });
}

module.exports = {
  setupRoutes: setupRoutes
}