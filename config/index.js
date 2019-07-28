var values = require('./config');

// Available to outer object
module.exports = {

  getNsDomain: function() {
    return values.ns_domain_name;
  },

  getPyDomain: function() {
    return values.py_domain_name;
  },

  getMaipoUrl: function() {
    return values.maipo_img_url;
  },

  getDbUrl: function() {
    return 'mongodb://' + values.db_username + ':' + values.db_password + '@ds119476.mlab.com:19476/' + values.db_name;
  },

  getDomain: function() {
    return values.domain;
  },

  getPublicIP: function() {
    return values.publicIp;
  },

  getPythonDomain: function() {
    return values.python_domain;
  },

  getServerPort: function() {
    return values.server_port;
  },

  getDbPort: function() {
    return values.db_port;
  },

  getPythonPort: function() {
    return values.python_port;
  },

  getPathDataset: function() {
    return values.path_dataset;
  },

  getChannelAccessToken: function() {
    return values.channelAccessToken;
  },

  getChannelId: function() {
    return values.channelId;
  },

  getChannelSecret: function() {
    return values.channelSecret;
  },

  getIpAddress: function() {
    return values.ipAddress;
  },

  getFullDomain: function() {
    return values.full_domain;
  },

  getLinebotPort:function() {
    return values.full_domain;
  },

  getTopTheOne:function() {
    return values.top_theone_number;
  }

}
