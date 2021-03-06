// This file has been autogenerated.

var profile = require('../../../lib/util/profile');

exports.getMockedProfile = function () {
  var newProfile = new profile.Profile();

  newProfile.addSubscription(new profile.Subscription({
    id: '5e7d1bb6-4953-44fe-8a54-43fbdb53b989',
    managementCertificate: {
      key: 'mockedKey',
      cert: 'mockedCert'
    },
    name: 'Mobilytics Test1',
    registeredProviders: ['website', 'mobileservice'],
    registeredResourceNamespaces: [],
    isDefault: true
  }, newProfile.environments['AzureCloud']));

  return newProfile;
};

exports.setEnvironment = function() {
};

exports.scopes = [[function (nock) { 
var result = 
nock('https://management.core.windows.net:443')
  .get('/5e7d1bb6-4953-44fe-8a54-43fbdb53b989/services/mobileservices/mobileservices/clitestDotNet4056/scheduler/jobs')
  .reply(200, "[{\"id\":\"416c4c61-4762-4562-863b-2a6be55224fc\",\"appName\":\"clitestDotNet4056\",\"name\":\"foobar\",\"status\":\"disabled\",\"intervalUnit\":\"minute\",\"intervalPeriod\":15,\"startTime\":\"2015-04-08T01:15:15.663Z\"}]", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '196',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  server: '1.0.6198.213 (rd_rdfe_stable.150402-1703) Microsoft-HTTPAPI/2.0',
  'x-ms-servedbyregion': 'ussouth2',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-powered-by': 'ASP.NET',
  'x-ms-request-id': '200ff717c55d8d3285d97f45ee82abe4',
  date: 'Wed, 08 Apr 2015 01:15:25 GMT' });
 return result; }]];