const Sequelize = require('sequelize');
const _ = require('underscore');
require('dotenv').config();

const orm = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
// const orm = new Sequelize('wyft', 'wyft', 'mysql', {
  host:'localhost',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

  operatorsAliases: false
});

orm.query("set FOREIGN_KEY_CHECKS=0");

const Guest = orm.define('Guest',{
  FIRST_NAME: Sequelize.STRING,
  LAST_NAME: Sequelize.STRING,  
  STREET_NUMBER: Sequelize.INTEGER,
  STREET_NAME: Sequelize.STRING,
  ZIP_CODE: Sequelize.INTEGER,
  USERNAME:Sequelize.STRING,
  PASSWORD: Sequelize.STRING,
  PRIMARY_PURPOSE: Sequelize.STRING
});

const Host = orm.define('Host', {
  FIRST_NAME: Sequelize.STRING,
  LAST_NAME: Sequelize.STRING,
  STREET_NUMBER: Sequelize.INTEGER,
  STREET_NAME: Sequelize.STRING,
  ZIP_CODE: Sequelize.INTEGER,
  ADDRESS: Sequelize.STRING,
  LAT: Sequelize.FLOAT,
  LNG: Sequelize.FLOAT,    
  USERNAME:Sequelize.STRING,
  PASSWORD: Sequelize.STRING,
  OPTIONAL_DETAILS: Sequelize.STRING
});

const Hosting_Session = orm.define('Hosting_Session',{
  DATE: Sequelize.STRING,
  START_TIME: Sequelize.STRING,
  END_TIME: Sequelize.STRING,
})

orm.query("set FOREIGN_KEY_CHECKS=1");

Hosting_Session.belongsTo(Host,{as:'theHost',foreignKey:'host_id'});
Host.hasMany(Hosting_Session,{foreignKey:'host_id'});

Guest.sync();
Host.sync();
Hosting_Session.sync();

const insertIntoGuest = function(guestData, cb) {
  const FIRST_NAME = guestData.firstName;
  const LAST_NAME = guestData.lastName;
  const STREET_NUMBER = guestData.streetNum;
  const STREET_NAME = guestData.streetName;
  const ZIP_CODE = guestData.zip;
  const USERNAME = guestData.userName;
  const PASSWORD= guestData.password;
  const PRIMARY_PURPOSE = guestData.purpose;
  return Guest.sync().then(function(){
    Guest
    .create({FIRST_NAME : FIRST_NAME, LAST_NAME: LAST_NAME, STREET_NUMBER:STREET_NUMBER,STREET_NAME:STREET_NAME,ZIP_CODE:ZIP_CODE,USERNAME:USERNAME,PASSWORD:PASSWORD,PRIMARY_PURPOSE:PRIMARY_PURPOSE})
    .then(function(result){
      cb(result);
      //console.log("FROM DB : INSERTED GUEST DATA TO GUEST TABLE");
    });
  });
}

const insertIntoHost = function(hostData, cb) {
  const FIRST_NAME = hostData.firstName;
  const LAST_NAME = hostData.lastName;
  const STREET_NUMBER = hostData.streetNum;
  const STREET_NAME = hostData.streetName;
  const ZIP_CODE = hostData.zip;
  const USERNAME = hostData.userName;
  const PASSWORD= hostData.password;
  const OPTIONAL_DETAILS = hostData.optional;
  return Host.sync().then(function(){
    return Host.findOrCreate(
      {
        where: {
          USERNAME:hostData.userName.trim()
        },
        defaults:{
          FIRST_NAME : FIRST_NAME, LAST_NAME: LAST_NAME, STREET_NUMBER:STREET_NUMBER,STREET_NAME:STREET_NAME,ZIP_CODE:ZIP_CODE,USERNAME:USERNAME,PASSWORD:PASSWORD,OPTIONAL_DETAILS:OPTIONAL_DETAILS
        }
      });
  }).spread(function(result, created){
    var hostId = result.dataValues.id;
    //console.log("FROM DB : INSERTED GUEST DATA TO HOST TABLE ", hostId);
    cb(result);
    return hostId;
  });
}

const insertIntoHostingSession = function(hostingSessionData, hostId, cb) {
  const DATE = hostingSessionData.DATE;
  const START_TIME = hostingSessionData.START_TIME;
  const END_TIME = hostingSessionData.END_TIME;
  return Hosting_Session.sync().then(function(){
    Hosting_Session
      .create({DATE:DATE, START_TIME:START_TIME, END_TIME:END_TIME,host_id:hostId})
      .then(function(result){
        cb(result)
        //console.log("FROM DB : INSERTED GUEST DATA TO HOSTING SESSIONS TABLE");
      })
  });
}



const fetchAvailableSessionDetails = function(zipCode, cb) {
  //fetch all available hosting sessions
  //sort it by time
  //filter by zipcopde
  return Hosting_Session.sync().then(function(){
     Hosting_Session.findAll({order:[['START_TIME','ASC']],include:[{model:Host,as:'theHost'}]}).then(function(data){
      var sessionData = data.map(e => e.dataValues);
      cb(sessionData);
      // console.log("from findAll session data ", sessionData);
      // console.log("from findAll host data", sessionData.map(e => e.theHost.dataValues));
     });
  })
}
//9/23/2018
const searchHostingSessions = function(cb) {
  orm.query("SELECT a.* FROM Hosts a inner join (select host_id from Hosting_Sessions group by host_id) b on a.id = b.host_id" , { type: orm.QueryTypes.SELECT})
  .then((hosts) => { 
    hosts.map((x) => {
      x['lat'] = x.LAT;
      x['lng'] = x.LNG;
      x['street_address'] = x.ADDRESS;
    });
    var promises = hosts.map((host) => {
      return orm.query("select * from Hosting_Sessions where host_id = :host_id", 
        { replacements: { host_id: host.id }, type: orm.QueryTypes.SELECT });      
    });

    Promise.all(promises).then((hosting_sessions) => {

      var result = _.groupBy(hosting_sessions, (x) => {
        return x.host_id;
      });      
      var result = result.undefined;
      if(result) {
        for(var i = 0; i < result.length; i++){
          var sessions = result[i];
          var host_id = sessions[0].host_id;    
          var _host = _.find(hosts, (h) => {
            return h.id ===  host_id;
          });
          _host['sections'] = sessions;
        }
        return hosts; 
      } else {
        return [];
      }         
    }).then((data) => {
      cb(data);
    })  
  })
  .catch((err) => console.log(err));
}


const fetchAllHosts = function(cb) {
  return Host.sync().then(function(){
    Host.findAll().then(function(data){
      cb(data);
    })
  });
}

const fetchSessionDetailsForHost = function(hostID, cb) {
  Hosting_Session.findAll({where:{host_id:hostID}}).then(function(data){
      var sessionData = data.map(e => e.dataValues);
      cb(sessionData);
  });
}

const fetchOneHostByUsername = function(username, cb) {
  Host.find({ where: { username: username } }).then(function(data) {
    if (data === null) {
      cb(null, {});
    } else {
      cb(null, data.dataValues);
    }
  }).catch(function(err) {
    cb(err, null);
  });
};


module.exports.Guest = Guest;
module.exports.Host = Host;
module.exports.Hosting_Session = Hosting_Session;
module.exports.insertIntoGuest = insertIntoGuest;
module.exports.insertIntoHost = insertIntoHost;
module.exports.insertIntoHostingSession=insertIntoHostingSession;
module.exports.fetchAvailableSessionDetails = fetchAvailableSessionDetails;
module.exports.fetchAllHosts = fetchAllHosts;
module.exports.fetchSessionDetailsForHost = fetchSessionDetailsForHost;
//module.exports.getSessionWithAddress = getSessionWithAddress;
module.exports.searchHostingSessions = searchHostingSessions;
module.exports.fetchOneHostByUsername = fetchOneHostByUsername;