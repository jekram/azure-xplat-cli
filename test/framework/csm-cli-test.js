/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

var _ = require('underscore');
var fs = require('fs');
var util = require('util');

var sinon = require('sinon');

var environment = require('../../lib/util/profile/environment');
var log = require('../../lib/util/logging');
var profile = require('../../lib/util/profile');
var utils = require('../../lib/util/utils');
var CLITest = require('./cli-test');

function CSMCLITest(testPrefix, forceMocked) {
  this.skipSubscription = true;
  CSMCLITest['super_'].call(this, testPrefix, forceMocked);
}

util.inherits(CSMCLITest, CLITest);

_.extend(CSMCLITest.prototype, {
  setupSuite: function (callback) {
    if (this.isMocked) {
      process.env.AZURE_ENABLE_STRICT_SSL = false;

      var profileData;

      CLITest.wrap(sinon, profile, 'load', function (originalLoad) {
        return function (filenameOrData) {
          if (!filenameOrData || filenameOrData === profile.defaultProfileFile) {
            if (profileData) {
              return originalLoad(profileData);
            }
            return originalLoad(createMockedSubscriptionFile());
          }
          return originalLoad(filenameOrData);
        };
      });

      CLITest.wrap(sinon, profile.Profile.prototype, 'save', function (originalSave) {
        return function (filename) {
          profileData = this._getSaveData();
        };
      });

      CLITest.wrap(sinon, utils, 'readConfig', function (originalReadConfig) {
        return function () {
          var config = originalReadConfig();
          config.mode = 'csm';
          return config;
        };
      });

      if (!this.isRecording) {
        CLITest.wrap(sinon, environment.prototype, 'acquireToken', function (original) {
          return function (authConfig, username, password, callback) {
            var fourHoursInMS = 4 * 60 * 60 * 1000;
            callback(null, {
              authConfig: authConfig,
              accessToken: 'foobar',
              expiresAt: new Date(Date.now() + fourHoursInMS) });
          };
        });

        CLITest.wrap(sinon, environment.prototype, 'getAccountSubscriptions', function (original) {
          return function (token, callback) {
            callback(null, [ {
              subscriptionId: process.env.AZURE_CSM_TEST_SUBSCRIPTIONID,
              subscriptionStatus: 0
            }]);
          };
        });
      }
    }

    if (this.isRecording) {
      fs.writeFileSync(this.recordingsFile,
        '// This file has been autogenerated.\n\n' +
        'exports.scopes = [');
    }

    this.removeCacheFiles();
    profile.current = profile.load();
    this.doLogin(callback);
  },

  teardownSuite: function (callback) {
    this.currentTest = 0;
    if (this.isMocked) {
      if (this.isRecording) {
        fs.appendFileSync(this.recordingsFile, '];');
      }

      if (profile.load.restore) {
        profile.load.restore();
      }

      if (profile.Profile.prototype.save.restore) {
        profile.Profile.prototype.save.restore();
      }

      if (utils.readConfig.restore) {
        utils.readConfig.restore();
      }

      if (environment.prototype.acquireToken.restore) {
        environment.prototype.acquireToken.restore();
      }

      if (environment.prototype.getAccountSubscriptions.restore) {
        environment.prototype.getAccountSubscriptions.restore();
      }

      delete process.env.AZURE_ENABLE_STRICT_SSL;
    }
    callback();
  },

  doLogin: function (callback) {
    var requiredVars = [
      'AZURE_CSM_TEST_ENVIRONMENT',
      'AZURE_CSM_TEST_USERNAME',
      'AZURE_CSM_TEST_PASSWORD',
      'AZURE_CSM_TEST_SUBSCRIPTIONID'
    ];

    var missingVars = requiredVars.filter(function (v) { return !process.env[v]; });
    if (missingVars.length !== 0) {
      var error = 'Missing environment variables: ' + missingVars.join(', ');
      log.error(error);
      throw new Error(error);
    }

    var testSubscriptionId = process.env['AZURE_CSM_TEST_SUBSCRIPTIONID'].toLowerCase();

    var env = profile.current.getEnvironment(process.env['AZURE_CSM_TEST_ENVIRONMENT']);
    env.addAccount(
      process.env['AZURE_CSM_TEST_USERNAME'],
      process.env['AZURE_CSM_TEST_PASSWORD'],
      function (err, newSubscriptions) {
        if (err) { return callback(err); }

        var defaultSet = false;
        newSubscriptions.forEach(function (s) {
          if (s.id.toLowerCase() === testSubscriptionId) {
            s.isDefault = true;
            defaultSet = true;
          }

          profile.current.addSubscription(s);
        });

        if (!defaultSet) {
          callback(new Error(util.format('ERROR: No subscription found for user matching id %s', testSubscriptionId)));
        }

        profile.current.save();

        callback();
      });
  }
});

function createMockedSubscriptionFile () {
  return {
    environments: [{
        "name": "next",
        "publishingProfileUrl": "https://auxnext.windows.azure-test.net/publishsettings/index",
        "portalUrl": "https://auxnext.windows.azure-test.net",
        "managementEndpointUrl": "https://managementnext.rdfetest.dnsdemo4.com",
        "resourceManagementEndpointUrl": "https://api-next.resources.windows-int.net",
        "activeDirectoryEndpointUrl": "https://login.windows-ppe.net",
        "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
        "hostNameSuffix": "azurewebsites.net",
        "commonTenantName": "common"
      }, {
        "name": "current",
        "publishingProfileUrl": "https://auxcurrent.windows.azure-test.net/publishsettings/index",
        "portalUrl": "https://auxcurrent.windows.azure-test.net",
        "managementEndpointUrl": "https://management.rdfetest.dnsdemo4.com",
        "resourceManagementEndpointUrl": "https://api-current.resources.windows-int.net",
        "activeDirectoryEndpointUrl": "https://login.windows-ppe.net",
        "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
        "hostNameSuffix": "azurewebsites.net",
        "commonTenantName": "common"
      }
    ],

    subscriptions: [
    ],
  };
}

module.exports = CSMCLITest;
