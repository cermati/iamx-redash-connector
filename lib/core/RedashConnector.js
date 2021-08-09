'use strict';

const Promise = require('bluebird');
const AccountManager = require('./AccountManager').AccountManager;
const Schema = require('./Schema');
const Metadata = require('./Metadata').ModuleMetadata;

exports.Connector = class RedashConnector {
  constructor (config) {
    this.accountManager = new AccountManager(config);
  };

  engine () {
    return Metadata.Engine;
  };

  version () {
    return Metadata.Version;
  };

  name () {
    return Metadata.Name;
  };

  supportedExecution () {
    return Metadata.SupportedExecution;
  };

  registryFormat () {
    return Schema.CredentialsRegistryDataSchema;
  };

  readContextFormat () {
    return Schema.ReadOnlyWorkflowContextSchema;
  };

  writeContextFormat () {
    return Schema.MutatingWorkflowContextSchema;
  };

  /**
   * Provision a user
   *
   * @param {Schema.MutatingContextType} context 
   * @returns {Promise<Schema.RedashUser>}
   */
  provision (context) {
    let mContext = { ...context };
    return this.accountManager.provisionUser(mContext);
  };

  /**
   * Revoke user
   * @param {Schema.MutatingContextType} context 
   * @returns {Promise<Schema.RedashUser>}
   */
  revoke (context) {
    let mContext = { ...context };
    return this.accountManager.revokeUser(mContext);
  };

  /**
   * Show single user based on context
   * @param {Schema.ReadOnlyContextType} context 
   * @returns {Promise<Schema.RedashUser>}
   */
  show (context) {
    let mContext = { ...context };
    return this.accountManager.showUsers(mContext)
      .then(res => res.results.length > 0 ? res.results[0]: null);
  };

  /**
   * Return list of users based on query
   * @param {Schema.ReadOnlyContextType} context 
   * @returns {Promise<Schema.RedashUser[]>}
   */
  fetchBatch(context) {
    let mContext = {...context};
    return this.accountManager.showUsers(mContext);
  }
};
