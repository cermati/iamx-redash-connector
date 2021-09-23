const { Connector } = require('./RedashConnector');
const Schema = require('./Schema');
const Promise = require('bluebird');

class BatchIterator {
  /**
   * @param {Connector} connector
   * @param {Object} object
   * @param {Schema.RedashUser[]} object.results
   * @param {number} object.pageSize
   * @param {number} object.page
   * @param {number} object.count
   * @param {string} object.order
   */
  constructor(connector, object) {
    this.connector = connector;
    this.results = object.results;
    this.pageSize = object.pageSize;
    this.page = object.page;
    this.count = object.count;
    this.order = object.order;
  }

  hasNext() {
    let totalPage = Math.ceil(this.count / this.pageSize);
    return this.page < totalPage;
  }

  /**
   * @returns {Promise<BatchIterator>}
   */
  next() {
    if (!this.hasNext()){
      return Promise.resolve(null)
    }

    return this.connector.fetchBatch({
      queryOptions: {
        order: this.order, page: this.page + 1, pageSize: this.pageSize
      }
    })
  }
}

exports.BatchIterator = BatchIterator;
