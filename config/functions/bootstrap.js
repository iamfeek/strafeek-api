'use strict';

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */

const findPublicRole = async () => {
  return await strapi
    .query("role", "users-permissions")
    .findOne({
      type: "public"
    });
};

const findAuthRole = async () => {
  return await strapi
    .query("role", "users-permissions")
    .findOne({
      type: "authenticated"
    });
};

const ensurePublicAccess = async () => {
  const role = await findPublicRole();
  const publicApplicationPermissions = await strapi
    .query('permission', 'users-permissions')
    .find({
      type: 'application',
      role: role.id
    });

  await Promise.all(
    publicApplicationPermissions.map(p =>
      strapi
        .query("permission", "users-permissions")
        .update({
          id: p.id
        }, {
          enabled: false
        })
    )
  )
}

const ensureAuthAccess = async () => {
  const authRole = await findAuthRole();
  const authApplicationPermissions = await strapi
    .query('permission', 'users-permissions')
    .find({
      type: 'application',
      role: authRole.id
    });

  const excludedPermissions = []

  await Promise.all(
    authApplicationPermissions.map(p => {
        const toBeExcluded = excludedPermissions.find(ep => {
          return ep.controller === p.controller && ep.action === p.action;
        })

        const enabled = !toBeExcluded;
        return strapi
          .query("permission", "users-permissions")
          .update({
            id: p.id
          }, {
            enabled
          })
      }
    )
  )
}

const enableGoogleProvider = async () => {
  const response = await strapi.query("core_store").findOne({
    key: "plugin_users-permissions_grant"
  });

  const providers = JSON.parse(response.value)
  providers.google.enabled = true;
  providers.google.key = process.env.GOOGLE_CLIENT_ID;
  providers.google.secret = process.env.GOOGLE_CLIENT_SECRET;

  await strapi.query("core_store").update({
    key: "plugin_users-permissions_grant"
  }, {
    value: providers
  })
}

const ensureUserPermissionsAccess = async () => {
  const authRole = await findAuthRole();
  const authUserPermissionsPermissions = await strapi
    .query('permission', 'users-permissions')
    .find({
      type: 'users-permissions',
      role: authRole.id
    });

  const allowedPermissions = [
    {
      controller: "auth",
      action: "connect"
    },
    {
      controller: "user",
      action: "me"
    },
    {
      controller: "user",
      action: "findone"
    },
  ];

  await Promise.all(
    authUserPermissionsPermissions.map(p => {
        const toBeAllowed = allowedPermissions.find(ep => {
          return ep.controller === p.controller && ep.action === p.action;
        })

        const enabled = !!toBeAllowed;
        return strapi
          .query("permission", "users-permissions")
          .update({
            id: p.id
          }, {
            enabled
          })
      }
    )
  )
}

module.exports = async () => {
  await ensurePublicAccess();
  await ensureAuthAccess();
  await ensureUserPermissionsAccess();
  await enableGoogleProvider();
};
