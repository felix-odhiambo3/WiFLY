-- FreeRADIUS PostgreSQL Schema for WiFly Hotspot Management
-- This schema provides RADIUS authentication and accounting for enterprise Wi-Fi access control.

-- RADIUS Check Items Table
-- Stores authentication check attributes (username/password, etc.)
CREATE TABLE radcheck (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL DEFAULT '',
  attribute VARCHAR(64) NOT NULL DEFAULT '',
  op CHAR(2) NOT NULL DEFAULT '==',
  value VARCHAR(253) NOT NULL DEFAULT '',
  CONSTRAINT radcheck_username_key UNIQUE (username, attribute)
);

-- Create indexes for radcheck
CREATE INDEX idx_radcheck_username ON radcheck(username);
CREATE INDEX idx_radcheck_attribute ON radcheck(attribute);

-- RADIUS Reply Items Table
-- Stores attributes to be returned in Access-Accept packets
CREATE TABLE radreply (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL DEFAULT '',
  attribute VARCHAR(64) NOT NULL DEFAULT '',
  op CHAR(2) NOT NULL DEFAULT '=',
  value VARCHAR(253) NOT NULL DEFAULT '',
  CONSTRAINT radreply_username_key UNIQUE (username, attribute)
);

-- Create indexes for radreply
CREATE INDEX idx_radreply_username ON radreply(username);
CREATE INDEX idx_radreply_attribute ON radreply(attribute);

-- RADIUS Group Check Items Table
-- Stores check attributes for user groups
CREATE TABLE radgroupcheck (
  id SERIAL PRIMARY KEY,
  groupname VARCHAR(64) NOT NULL DEFAULT '',
  attribute VARCHAR(64) NOT NULL DEFAULT '',
  op CHAR(2) NOT NULL DEFAULT '==',
  value VARCHAR(253) NOT NULL DEFAULT '',
  CONSTRAINT radgroupcheck_groupname_key UNIQUE (groupname, attribute)
);

-- RADIUS Group Reply Items Table
-- Stores reply attributes for user groups
CREATE TABLE radgroupreply (
  id SERIAL PRIMARY KEY,
  groupname VARCHAR(64) NOT NULL DEFAULT '',
  attribute VARCHAR(64) NOT NULL DEFAULT '',
  op CHAR(2) NOT NULL DEFAULT '=',
  value VARCHAR(253) NOT NULL DEFAULT '',
  CONSTRAINT radgroupreply_groupname_key UNIQUE (groupname, attribute)
);

-- User Group Membership Table
-- Maps users to groups
CREATE TABLE radusergroup (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL DEFAULT '',
  groupname VARCHAR(64) NOT NULL DEFAULT '',
  priority INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT radusergroup_username_key UNIQUE (username, groupname)
);

-- RADIUS Accounting Table
-- Stores session accounting data
CREATE TABLE radacct (
  radacctid SERIAL PRIMARY KEY,
  acctsessionid VARCHAR(64) NOT NULL DEFAULT '',
  acctuniqueid VARCHAR(32) NOT NULL DEFAULT '',
  username VARCHAR(64) NOT NULL DEFAULT '',
  groupname VARCHAR(64) NOT NULL DEFAULT '',
  realm VARCHAR(64) DEFAULT '',
  nasipaddress INET NOT NULL,
  nasportid VARCHAR(15) DEFAULT NULL,
  nasporttype VARCHAR(32) DEFAULT NULL,
  acctstarttime TIMESTAMPTZ,
  acctupdatetime TIMESTAMPTZ,
  acctstoptime TIMESTAMPTZ,
  acctinterval INTEGER,
  acctsessiontime INTEGER,
  acctauthentic VARCHAR(32) DEFAULT NULL,
  connectinfo_start VARCHAR(50) DEFAULT NULL,
  connectinfo_stop VARCHAR(50) DEFAULT NULL,
  acctinputoctets BIGINT DEFAULT 0,
  acctoutputoctets BIGINT DEFAULT 0,
  calledstationid VARCHAR(50) NOT NULL DEFAULT '',
  callingstationid VARCHAR(50) NOT NULL DEFAULT '',
  acctterminatecause VARCHAR(32) NOT NULL DEFAULT '',
  servicetype VARCHAR(32) DEFAULT NULL,
  framedprotocol VARCHAR(32) DEFAULT NULL,
  framedipaddress INET DEFAULT NULL,
  framedipv6address INET DEFAULT NULL,
  framedipv6prefix INET DEFAULT NULL,
  framedinterfaceid VARCHAR(44) DEFAULT NULL,
  delegatedipv6prefix INET DEFAULT NULL
);

-- Create indexes for radacct
CREATE INDEX idx_radacct_username ON radacct(username);
CREATE INDEX idx_radacct_acctsessionid ON radacct(acctsessionid);
CREATE INDEX idx_radacct_acctuniqueid ON radacct(acctuniqueid);
CREATE INDEX idx_radacct_callingstationid ON radacct(callingstationid);
CREATE INDEX idx_radacct_starttime ON radacct(acctstarttime);
CREATE INDEX idx_radacct_stoptime ON radacct(acctstoptime);

-- RADIUS Post-Authentication Table
-- Stores post-authentication logging
CREATE TABLE radpostauth (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL DEFAULT '',
  pass VARCHAR(64) NOT NULL DEFAULT '',
  reply VARCHAR(32) NOT NULL DEFAULT '',
  authdate TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  class VARCHAR(64) DEFAULT NULL
);

-- Create indexes for radpostauth
CREATE INDEX idx_radpostauth_username ON radpostauth(username);
CREATE INDEX idx_radpostauth_authdate ON radpostauth(authdate);

-- NAS (Network Access Server) Table
-- Stores information about RADIUS clients (routers/APs)
CREATE TABLE nas (
  id SERIAL PRIMARY KEY,
  nasname VARCHAR(128) NOT NULL,
  shortname VARCHAR(32),
  type VARCHAR(30) DEFAULT 'other',
  ports INTEGER,
  secret VARCHAR(60) NOT NULL,
  server VARCHAR(64),
  community VARCHAR(50),
  description VARCHAR(200) DEFAULT 'RADIUS Client',
  CONSTRAINT nas_nasname_key UNIQUE (nasname)
);

-- Create indexes for nas
CREATE INDEX idx_nas_nasname ON nas(nasname);

-- RADIUS Max Session Table
-- Stores maximum session limits per user
CREATE TABLE radmax (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL DEFAULT '',
  attribute VARCHAR(64) NOT NULL DEFAULT '',
  op CHAR(2) NOT NULL DEFAULT '==',
  value VARCHAR(253) NOT NULL DEFAULT '',
  CONSTRAINT radmax_username_key UNIQUE (username, attribute)
);

-- Insert sample NAS client (OpenWrt router)
INSERT INTO nas (nasname, shortname, type, secret, description)
VALUES ('192.168.1.1', 'openwrt-router', 'other', 'testing123', 'WiFly OpenWrt Hotspot Router');

-- Insert sample user group for hotspot users
INSERT INTO radgroupreply (groupname, attribute, op, value)
VALUES ('hotspot_users', 'Session-Timeout', ':=', '86400'); -- 24 hours default

-- Insert sample group check (optional, for group-based authentication)
INSERT INTO radgroupcheck (groupname, attribute, op, value)
VALUES ('hotspot_users', 'Auth-Type', ':=', 'Accept');
