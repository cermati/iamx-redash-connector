'use strict';

const Promise = require('bluebird');
const request = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');

const FAILED_LOGIN_TITLE_TEXT = 'Login to Redash';
const SUCCESS_LOGIN_TITLE_TEXT = 'Redash';

const errors = require('./Errors');

/**
 * @class RedashClient
 */
exports.RedashClient = class RedashClient {
  constructor (config) {
    this.config = config;
    this.agent = request.agent();

    if (config.tls) {
      const cert = fs.readFileSync(config.tls.cert);
      const key = fs.readFileSync(config.tls.key);

      this.agent = this.agent
        .cert(cert)
        .key(key);

      if (config.tls.ca) {
        const ca = fs.readFileSync(config.tls.ca);
        this.agent = this.agent
          .ca(ca);
      }
    }
  };

  /**
   * Authenticate before making a request. It will simulate login via login form
   *
   * Example Request:
   *  - POST /login
   *  - Payload: form-data {email: "test@cermati.com", "password": "12345"}
   *
   * @returns {Promise}
   */
  login () {
    let uri = `${this.config.baseUri}/login`
    let payload = {
      email: this.config.credentials.email,
      password: this.config.credentials.password
    };

    return Promise.resolve(
      this.agent.post(uri)
        .type('form')
        .send(payload)
        .then(response => {
          if (!this._loginSuccess(response)) {
            throw('Invalid credentials');
          }
        })
    );
  };

  /**
   * Retrieve users based on query and paging
   *
   * Example Request:
   * - GET /api/users?q=test@cermati.com
   *
   * Example Response:
   *  {
   *    "count": 1,
   *    "page": 1,
   *    "page_size": 1,
   *    "results": [
   *     {
   *        "auth_type": "external",
   *        "is_disabled": false,
   *        "updated_at": "2021-08-05T03:20:14.712Z",
   *        "profile_image_url": "https://www.gravatar.com/avatar/a8e50b556f856e6620b2c8613026a2f9?s=40&d=identicon",
   *        "is_invitation_pending": false,
   *        "groups": [{"id": 1,"name": "admin"},{"id": 2,"name": "default"}],
   *        "credentials": {},
   *        "id": 340,
   *        "name": "Test User",
   *        "created_at": "2021-08-03T06:54:38.696Z",
   *        "disabled_at": null,
   *        "is_email_verified": true,
   *        "active_at": "2021-08-05T03:20:05Z",
   *        "email": "test@cermati.com"
   *       },
   *    ]
   *  }
   * @param {string} email
   * @param {string} [status='active']
   * @param {Object} [options]
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=20]
   * @param {string} [options.order='created_at']
   * @returns {Promise<object>}
   */
  getUsers (email, status = 'active', options = { page: 1, pageSize: 20, order: 'created_at' }) {
    this._mustLogin();

    let uri = `${this.config.baseUri}/api/users`;
    let query = {
      q: email || '',
      page: options.page,
      page_size: options.pageSize,
      order: options.order
    };

    if (status === 'pending') query.pending = true;
    else if (status === 'disabled') query.disabled = true;
    else query.pending = false;

    return Promise.resolve(
      this.agent.get(uri)
        .set('Cookie', this.cookies)
        .query(query)
        .then(response => {
          let result = JSON.parse(response.text);
          return result;
        })
    );
  };

  /**
   * Create new user
   * Example Request:
   * - Endpoint: POST /api/users
   * - Payload: JSON {"email": "test@cermati.com", "name": "Test user"}
   *
   * @param {string} email
   * @param {string} name
   * @returns {Promise}
   */
  createUser (email, name) {
    this._mustLogin();

    let uri = `${this.config.baseUri}/api/users`
    let payload = {
      email: email,
      name: name
    };

    return Promise.resolve(
      this.agent.post(uri)
        .type('json')
        .set('Cookie', this.cookies)
        .send(payload)
        .then(response => {
          let result = JSON.parse(response.text);
          return result;
        })
    );
  };

  /**
   * Enable disabled user
   *
   * Example Request: POST /api/users/330/disable
   *
   * @param {string} email
   * @returns {Promise}
   */
  enableUser (email) {
    this._mustLogin();

    return this.getUsers(email, 'disabled').then(res => {
      if (res.results.length <= 0) {
        throw new Error(errors.USER_DISABLED_NOT_FOUND_ERROR);
      }

      let userId = res.results[0].id;
      let uri = `${this.config.baseUri}/api/users/${userId}/disable`;

      return this.agent.delete(uri)
        .set('Cookie', this.cookies)
        .then(response => {
          let result = JSON.parse(response.text);
          return result;
        });
    });
  };

  /**
   * Disable user
   *
   * Example Request: POST /api/users/330/disable
   *
   * @param {string} email
   * @returns {Promise}
   */
  disableUser (email) {
    this._mustLogin();

    return this.getUsers(email, 'active').then(res => {
      if (res.results.length <= 0) {
        throw new Error(errors.USER_ACTIVE_NOT_FOUND_ERROR);
      }

      let userId = res.results[0].id;
      let uri = `${this.config.baseUri}/api/users/${userId}/disable`;

      return this.agent.post(uri)
        .set('Cookie', this.cookies)
        .then(response => {
          let result = JSON.parse(response.text);
          return result;
        });
    });
  };

  /**
   * Resend user invitation
   *
   * Example Request: POST /api/users/1/invite
   * @param {string} email 
   * @returns {Promise}
   */
  resendUserInvitation(email) {
    this._mustLogin();

    return this.getUsers(email, 'pending').then(res => {
      if (res.results.length <= 0) {
        throw new Error(errors.USER_PENDING_NOT_FOUND_ERROR);
      }

      let userId = res.results[0].id;
      let uri = `${this.config.baseUri}/api/users/${userId}/invite`;

      return this.agent.post(uri)
        .set('Cookie', this.cookies)
        .then(response => {
          let result = JSON.parse(response.text);
          return result;
        });
    });
  };

  /**
   * Delete Pending User
   *
   * Example Request: DELETE /api/users/1
   *
   * @param {string} email 
   * @returns {Promise}
   */
  deletePendingUser (email) {
    this._mustLogin();

    return this.getUsers(email, 'pending').then(res => {
      if (res.results.length <= 0) {
        // If the user is also not pending, then it's somehow already disabled
        // Just return the user data if that's the case.
        return this.getUsers(email, 'disabled').then(res => res.results[0])
      }

      let userId = res.results[0].id;
      let uri = `${this.config.baseUri}/api/users/${userId}`;

      return this.agent.delete(uri)
        .set('Cookie', this.cookies)
        .then(response => {
          let result = JSON.parse(response.text);
          return result;
        });
    });
  };

  _loginSuccess(response) {
    let $ = cheerio.load(response.text);
    let pageTitle = $('title').text();

    if (pageTitle === SUCCESS_LOGIN_TITLE_TEXT) {
      this.cookies = response.request.cookies;
      return true;
    };

    if (pageTitle === FAILED_LOGIN_TITLE_TEXT) {
      return false;
    };

    throw('Login error');
  };

  _mustLogin () {
    if (!this.cookies) {
      throw('Must be logged in to access this resource');
    }
  };
};
