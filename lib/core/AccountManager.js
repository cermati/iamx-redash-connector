'use strict';

const RedashClient = require('./RedashClient').RedashClient;

const errors = require('./Errors');

exports.AccountManager = class AccountManager {
  constructor (config) {
    this.config = config;
  };

  redashClient () {
    this.client = this.client || new RedashClient(this.config);
    return this.client;
  };

  provisionUser (context) {
    return this.redashClient().login()
      .then(() => {
        return this.redashClient().createUser(context.user.email, context.user.name)
          .catch((err) => {
            if (err.response.body.message === errors.EMAIL_TAKEN_ERROR) {
              return this.redashClient().getUsers(context.user.email, 'disabled')
                .then(res => {
                  // If user is disabled, then we need to enable it first and then
                  // resend the invitation if the user invitation status is pending
                  if (res.results.length > 0) {
                    return this.redashClient().enableUser(context.user.email)
                      .then(() => {
                        if (res.results[0].is_invitation_pending) {
                          return this.redashClient().resendUserInvitation(context.user.email);
                        }
                      });
                  }

                  // Otherwise, check if the invitation status is pending, if yes then
                  // resend the invitation
                  return this.redashClient().getUsers(context.user.email, 'pending')
                    .then(res => {
                      if (res.results.length > 0) {
                        return this.redashClient().resendUserInvitation(context.user.email);
                      }
                    });
                });
            }

            throw err;
          });
      });
  }

  revokeUser (context) {
    return this.redashClient().login()
      .then(() => {
        return this.redashClient().disableUser(context.user.email)
          .catch(() => {
            return this.redashClient().deletePendingUser(context.user.email);
          });
      });
  }

  showUsers (context) {
    return this.redashClient().login()
      .then(() => {
        return this.redashClient().getUsers(context.user.email, context.user.status, context.queryOptions)
          .then((result) => {
            return result;
          });
      });
  }
};
