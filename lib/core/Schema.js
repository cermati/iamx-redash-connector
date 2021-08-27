'use strict';

const CredentialsRegistryDataSchema = {
  type: 'object',
  properties: {
    credentials: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' }
      },
      required: [ 'email', 'password' ]
    },
    tls: {
      type: "object",
      properties: {
        ca: { type: 'string' },
        cert: { type: 'string' },
        key: { type: 'string' },
      },
      required: [ 'cert', 'key' ]
    },
    baseUri: { type: 'string' },
    redashVersion: { type: 'string' }
  },
  required: [ 'credentials', 'baseUri' ]
};

/**
 * @typedef {Object} MutatingContextType
 * @property {Object} user
 * @property {string} user.email
 * @property {string} user.name
 */
const MutatingWorkflowContextSchema = {
  type: "object",
  properties: {
    user: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string' } // Name is required when creating account
      },
      required: [ 'email' ]
    }
  }
};

/**
 * @typedef {Object} ReadOnlyContextType
 * @property {Object} user
 * @property {string} user.email
 * @property {string} user.status
 * @property {Object} queryOptions
 * @property {number} queryOptions.page
 * @property {number} queryOptions.pageSize
 * @property {string} queryOptions.order
 */
const ReadOnlyWorkflowContextSchema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        status: { type: 'string', default: 'active' }
      }
    },
    queryOptions: {
      type: 'object',
      properties: {
        page: { type: 'integer', default: 1 },
        pageSize: { type: 'integer', default: 20 },
        order: { type: 'string', default: 'created_at' }
      }
    }
  }
};

/**
 * @typedef {Object} ListContext
 * @property {Object} queryOptions
 * @property {number} queryOptions.page
 * @property {number} queryOptions.pageSize
 * @property {string} queryOptions.order
 */
const ListContextSchema = {
  type: "object",
  properties: {
    queryOptions: {
      type: 'object',
      properties: {
        page: { type: 'integer', default: 1 },
        pageSize: { type: 'integer', default: 20 },
        order: { type: 'string', default: 'created_at' }
      }
    }
  }
}

/**
 * @typedef {Object} RedashUser
 * @property {number} id
 * @property {string} email
 * @property {string} name
 * @property {boolean} is_disabled
 * @property {boolean} is_invitation_pending
 * @property {[{id: number, name: string}]} groups
 */

exports.CredentialsRegistryDataSchema = CredentialsRegistryDataSchema;
exports.MutatingWorkflowContextSchema = MutatingWorkflowContextSchema;
exports.ReadOnlyWorkflowContextSchema = ReadOnlyWorkflowContextSchema;
exports.ListContextSchema = ListContextSchema;
