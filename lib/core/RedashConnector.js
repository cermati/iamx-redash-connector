'use strict';

const Promise = require('bluebird');
const AccountManager = require('./AccountManager').AccountManager;
const Schema = require('./Schema');
const Metadata = require('./Metadata').ModuleMetadata;
const BatchIterator = require('./iterator').BatchIterator;

exports.Connector = class RedashConnector {
  constructor(config) {
    this.accountManager = new AccountManager(config);
  };

  engine() {
    return Metadata.Engine;
  };

  version() {
    return Metadata.Version;
  };

  name() {
    return Metadata.Name;
  };

  supportedExecution() {
    return Metadata.SupportedExecution;
  };

  registryFormat() {
    return Schema.CredentialsRegistryDataSchema;
  };

  readContextFormat() {
    return Schema.ReadOnlyWorkflowContextSchema;
  };

  writeContextFormat() {
    return Schema.MutatingWorkflowContextSchema;
  };

  listContextFormat() {
    return Schema.ListContextSchema;
  }

  /**
   * Provision a user
   *
   * @param {Schema.MutatingContextType} context 
   * @returns {Promise<Schema.RedashUser>}
   */
  provision(context) {
    let mContext = { ...context };
    return this.accountManager.provisionUser(mContext)
      .then(user => ({ user }));
  };

  /**
   * Revoke user
   * @param {Schema.MutatingContextType} context 
   * @returns {Promise<Schema.RedashUser>}
   */
  revoke(context) {
    let mContext = { ...context };
    return this.accountManager.revokeUser(mContext)
      .then(user => ({ user }));
  };

  /**
   * Show single user based on context
   * @param {Schema.ReadOnlyContextType} context
   * @returns {Promise<{ user: Schema.RedashUser }>}
   */
  show(context) {
    let mContext = { ...context };
    return this.accountManager.showUsers(mContext)
      .then(res => res.results.length > 0 ? res.results[0] : null)
      .then(user => ({ user }));
  };

  /**
   * Return list of users based on query
   * @param {Schema.ListContext} context 
   * @returns {Promise<BatchIterator>}
   */
  fetchBatch(context) {
    let mContext = { ...context };
    return this.accountManager.showUsers(mContext)
      .then(data => new BatchIterator(this, {
        results: data.results.map(user => ({ user })),
        page: data.page,
        pageSize: data.page_size,
        order: mContext.queryOptions && mContext.queryOptions.order,
        count: data.count,
      })
      )
  }
};
