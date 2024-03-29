'use strict';
// TODO: refactor code to async await

const RedashClient = require('./RedashClient').RedashClient;
const _ = require('lodash');

const errors = require('./Errors');

exports.AccountManager = class AccountManager {
  constructor (config) {
    this.config = config;
  };

  redashClient () {
    if (!this.client){
      this.client = new RedashClient(this.config);
    }
    return this.client;
  };

  provisionUser (context) {
    return this.redashClient().login()
      .then(() => {
        return this.redashClient().createUser(context.user.email, context.user.name, context.user.group.group_id)
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
                        return res.results[0];
                      });
                  }

                  // Otherwise, check if the invitation status is pending, if yes then
                  // resend the invitation
                  return this.redashClient().getUsers(context.user.email, 'pending')
                    .then(res => {
                      if (res.results.length > 0) {
                        return this.redashClient().resendUserInvitation(context.user.email);
                      }
                      //Otherwise, check if user status is already active,
                      //if yes then add the group_id to user's group if it's not yet exist
                      return this.redashClient().getUsers(context.user.email, 'active')
                        .then(res => {
                          if (res.results.length > 0) {
                            const currentUser = res.results[0];
                            const groupIds = _.map(currentUser["groups"], (res) => { return res.id });
                            if (!groupIds.includes(context.user.group.group_id)) {
                              return this.redashClient().addUserGroups(currentUser["id"], context.user.group.group_id);
                            }

                            throw(`User ${context.user.email} is already part of group with id ${context.user.group.group_id}`);
                          }

                          return res.results[0];
                        });
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
    const userQuery = context.user && context.user.email;
    const userStatus = (context.user && context.status) || "active";

    return this.redashClient().login()
      .then(() => {
        return this.redashClient().getUsers(userQuery, userStatus, context.queryOptions)
          .then((result) => {
            return result;
          });
      });
  }

};
