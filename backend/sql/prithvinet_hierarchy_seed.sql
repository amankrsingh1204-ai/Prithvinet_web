-- PRITHVINET FULL DATABASE SEED

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS states CASCADE;


CREATE TABLE states (
    id SERIAL PRIMARY KEY,
    state_name TEXT NOT NULL,
    super_admin_email TEXT UNIQUE NOT NULL
);


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN','REGIONAL_OFFICER','MONITORING_TEAM','INDUSTRY_USER','CITIZEN')),
    password TEXT NOT NULL,
    state_id INTEGER REFERENCES states(id),
    district_name TEXT,
    team_zone TEXT CHECK(team_zone IN ('north','south'))
);

INSERT INTO states (state_name, super_admin_email) VALUES ('Bihar','bihar@prithvinet.com');
INSERT INTO states (state_name, super_admin_email) VALUES ('Haryana','haryana@prithvinet.com');
INSERT INTO states (state_name, super_admin_email) VALUES ('Jharkhand','jharkhand@prithvinet.com');
INSERT INTO states (state_name, super_admin_email) VALUES ('Chhattisgarh','chhattisgarh@prithvinet.com');

INSERT INTO users (email, role, password, state_id)
SELECT super_admin_email, 'SUPER_ADMIN', 'prithvinet123', id
FROM states;

INSERT INTO users (email, role, password, state_id, district_name) VALUES ('araria@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'araria');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northararia@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'araria','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southararia@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'araria','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('arwal@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'arwal');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northarwal@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'arwal','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southarwal@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'arwal','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('aurangabad@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'aurangabad');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northaurangabad@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'aurangabad','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southaurangabad@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'aurangabad','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('banka@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'banka');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbanka@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'banka','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbanka@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'banka','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('begusarai@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'begusarai');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbegusarai@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'begusarai','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbegusarai@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'begusarai','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('bhagalpur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'bhagalpur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbhagalpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'bhagalpur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbhagalpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'bhagalpur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('bhojpur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'bhojpur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbhojpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'bhojpur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbhojpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'bhojpur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('buxar@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'buxar');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbuxar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'buxar','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbuxar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'buxar','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('darbhanga@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'darbhanga');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northdarbhanga@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'darbhanga','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southdarbhanga@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'darbhanga','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('east-champaran@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'east-champaran');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northeast-champaran@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'east-champaran','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southeast-champaran@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'east-champaran','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('gaya@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'gaya');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northgaya@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'gaya','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southgaya@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'gaya','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('gopalganj@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'gopalganj');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northgopalganj@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'gopalganj','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southgopalganj@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'gopalganj','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('jamui@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'jamui');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northjamui@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'jamui','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southjamui@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'jamui','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('jehanabad@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'jehanabad');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northjehanabad@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'jehanabad','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southjehanabad@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'jehanabad','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('kaimur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'kaimur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkaimur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'kaimur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkaimur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'kaimur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('katihar@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'katihar');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkatihar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'katihar','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkatihar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'katihar','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('khagaria@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'khagaria');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkhagaria@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'khagaria','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkhagaria@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'khagaria','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('kishanganj@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'kishanganj');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkishanganj@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'kishanganj','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkishanganj@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'kishanganj','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('lakhisarai@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'lakhisarai');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northlakhisarai@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'lakhisarai','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southlakhisarai@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'lakhisarai','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('madhepura@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'madhepura');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northmadhepura@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'madhepura','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southmadhepura@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'madhepura','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('madhubani@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'madhubani');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northmadhubani@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'madhubani','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southmadhubani@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'madhubani','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('munger@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'munger');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northmunger@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'munger','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southmunger@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'munger','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('muzaffarpur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'muzaffarpur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northmuzaffarpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'muzaffarpur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southmuzaffarpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'muzaffarpur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('nalanda@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'nalanda');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northnalanda@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'nalanda','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southnalanda@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'nalanda','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('nawada@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'nawada');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northnawada@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'nawada','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southnawada@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'nawada','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('patna@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'patna');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northpatna@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'patna','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southpatna@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'patna','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('purnia@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'purnia');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northpurnia@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'purnia','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southpurnia@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'purnia','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('rohtas@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'rohtas');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northrohtas@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'rohtas','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southrohtas@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'rohtas','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('saharsa@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'saharsa');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsaharsa@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'saharsa','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsaharsa@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'saharsa','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('samastipur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'samastipur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsamastipur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'samastipur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsamastipur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'samastipur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('saran@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'saran');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsaran@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'saran','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsaran@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'saran','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('sheikhpura@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'sheikhpura');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsheikhpura@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'sheikhpura','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsheikhpura@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'sheikhpura','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('sheohar@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'sheohar');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsheohar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'sheohar','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsheohar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'sheohar','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('sitamarhi@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'sitamarhi');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsitamarhi@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'sitamarhi','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsitamarhi@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'sitamarhi','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('siwan@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'siwan');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsiwan@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'siwan','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsiwan@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'siwan','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('supaul@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'supaul');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsupaul@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'supaul','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsupaul@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'supaul','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('vaishali@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'vaishali');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northvaishali@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'vaishali','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southvaishali@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'vaishali','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('west-champaran@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'west-champaran');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northwest-champaran@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'west-champaran','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southwest-champaran@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Bihar'),'west-champaran','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('ambala@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'ambala');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northambala@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'ambala','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southambala@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'ambala','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('bhiwani@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'bhiwani');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbhiwani@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'bhiwani','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbhiwani@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'bhiwani','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('charkhidadri@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'charkhidadri');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northcharkhidadri@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'charkhidadri','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southcharkhidadri@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'charkhidadri','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('faridabad@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'faridabad');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northfaridabad@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'faridabad','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southfaridabad@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'faridabad','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('fatehabad@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'fatehabad');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northfatehabad@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'fatehabad','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southfatehabad@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'fatehabad','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('gurugram@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'gurugram');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northgurugram@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'gurugram','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southgurugram@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'gurugram','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('hisar@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'hisar');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northhisar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'hisar','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southhisar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'hisar','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('jhajjar@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'jhajjar');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northjhajjar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'jhajjar','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southjhajjar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'jhajjar','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('jind@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'jind');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northjind@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'jind','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southjind@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'jind','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('kaithal@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'kaithal');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkaithal@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'kaithal','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkaithal@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'kaithal','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('karnal@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'karnal');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkarnal@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'karnal','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkarnal@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'karnal','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('kurukshetra@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'kurukshetra');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkurukshetra@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'kurukshetra','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkurukshetra@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'kurukshetra','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('mahendragarh@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'mahendragarh');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northmahendragarh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'mahendragarh','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southmahendragarh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'mahendragarh','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('nuh@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'nuh');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northnuh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'nuh','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southnuh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'nuh','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('palwal@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'palwal');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northpalwal@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'palwal','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southpalwal@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'palwal','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('panchkula@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'panchkula');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northpanchkula@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'panchkula','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southpanchkula@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'panchkula','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('panipat@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'panipat');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northpanipat@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'panipat','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southpanipat@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'panipat','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('rewari@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'rewari');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northrewari@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'rewari','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southrewari@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'rewari','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('rohtak@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'rohtak');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northrohtak@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'rohtak','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southrohtak@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'rohtak','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('sirsa@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'sirsa');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsirsa@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'sirsa','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsirsa@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'sirsa','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('sonipat@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'sonipat');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsonipat@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'sonipat','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsonipat@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'sonipat','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('yamunanagar@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'yamunanagar');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northyamunanagar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'yamunanagar','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southyamunanagar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Haryana'),'yamunanagar','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('bokaro@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'bokaro');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbokaro@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'bokaro','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbokaro@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'bokaro','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('chatra@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'chatra');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northchatra@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'chatra','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southchatra@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'chatra','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('deoghar@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'deoghar');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northdeoghar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'deoghar','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southdeoghar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'deoghar','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('dhanbad@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'dhanbad');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northdhanbad@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'dhanbad','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southdhanbad@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'dhanbad','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('dumka@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'dumka');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northdumka@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'dumka','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southdumka@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'dumka','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('east-singhbhum@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'east-singhbhum');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northeast-singhbhum@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'east-singhbhum','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southeast-singhbhum@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'east-singhbhum','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('garhwa@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'garhwa');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northgarhwa@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'garhwa','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southgarhwa@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'garhwa','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('giridih@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'giridih');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northgiridih@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'giridih','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southgiridih@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'giridih','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('godda@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'godda');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northgodda@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'godda','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southgodda@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'godda','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('gumla@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'gumla');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northgumla@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'gumla','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southgumla@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'gumla','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('hazaribagh@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'hazaribagh');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northhazaribagh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'hazaribagh','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southhazaribagh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'hazaribagh','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('jamtara@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'jamtara');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northjamtara@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'jamtara','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southjamtara@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'jamtara','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('khunti@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'khunti');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkhunti@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'khunti','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkhunti@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'khunti','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('koderma@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'koderma');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkoderma@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'koderma','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkoderma@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'koderma','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('latehar@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'latehar');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northlatehar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'latehar','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southlatehar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'latehar','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('lohardaga@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'lohardaga');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northlohardaga@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'lohardaga','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southlohardaga@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'lohardaga','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('pakur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'pakur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northpakur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'pakur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southpakur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'pakur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('palamu@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'palamu');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northpalamu@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'palamu','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southpalamu@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'palamu','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('ramgarh@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'ramgarh');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northramgarh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'ramgarh','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southramgarh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'ramgarh','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('ranchi@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'ranchi');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northranchi@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'ranchi','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southranchi@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'ranchi','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('sahibganj@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'sahibganj');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsahibganj@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'sahibganj','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsahibganj@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'sahibganj','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('seraikela-kharsawan@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'seraikela-kharsawan');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northseraikela-kharsawan@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'seraikela-kharsawan','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southseraikela-kharsawan@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'seraikela-kharsawan','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('simdega@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'simdega');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsimdega@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'simdega','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsimdega@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'simdega','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('west-singhbhum@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'west-singhbhum');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northwest-singhbhum@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'west-singhbhum','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southwest-singhbhum@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Jharkhand'),'west-singhbhum','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('balod@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'balod');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbalod@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'balod','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbalod@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'balod','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('balodabazar@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'balodabazar');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbalodabazar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'balodabazar','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbalodabazar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'balodabazar','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('balrampur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'balrampur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbalrampur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'balrampur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbalrampur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'balrampur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('bastar@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bastar');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbastar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bastar','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbastar@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bastar','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('bemetara@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bemetara');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbemetara@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bemetara','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbemetara@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bemetara','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('bijapur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bijapur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbijapur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bijapur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbijapur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bijapur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('bilaspur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bilaspur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northbilaspur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bilaspur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southbilaspur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'bilaspur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('dantewada@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'dantewada');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northdantewada@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'dantewada','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southdantewada@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'dantewada','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('dhamtari@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'dhamtari');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northdhamtari@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'dhamtari','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southdhamtari@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'dhamtari','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('durg@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'durg');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northdurg@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'durg','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southdurg@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'durg','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('gariaband@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'gariaband');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northgariaband@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'gariaband','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southgariaband@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'gariaband','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('gaurela-pendra-marwahi@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'gaurela-pendra-marwahi');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northgaurela-pendra-marwahi@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'gaurela-pendra-marwahi','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southgaurela-pendra-marwahi@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'gaurela-pendra-marwahi','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('janjgir-champa@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'janjgir-champa');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northjanjgir-champa@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'janjgir-champa','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southjanjgir-champa@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'janjgir-champa','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('jashpur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'jashpur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northjashpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'jashpur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southjashpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'jashpur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('kabirdham@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'kabirdham');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkabirdham@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'kabirdham','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkabirdham@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'kabirdham','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('kanker@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'kanker');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkanker@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'kanker','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkanker@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'kanker','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('kondagaon@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'kondagaon');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkondagaon@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'kondagaon','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkondagaon@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'kondagaon','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('korba@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'korba');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkorba@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'korba','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkorba@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'korba','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('korea@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'korea');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkorea@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'korea','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkorea@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'korea','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('mahasamund@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'mahasamund');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northmahasamund@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'mahasamund','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southmahasamund@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'mahasamund','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('mungeli@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'mungeli');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northmungeli@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'mungeli','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southmungeli@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'mungeli','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('narayanpur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'narayanpur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northnarayanpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'narayanpur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southnarayanpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'narayanpur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('raigarh@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'raigarh');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northraigarh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'raigarh','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southraigarh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'raigarh','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('raipur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'raipur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northraipur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'raipur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southraipur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'raipur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('rajnandgaon@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'rajnandgaon');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northrajnandgaon@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'rajnandgaon','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southrajnandgaon@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'rajnandgaon','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('sakti@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'sakti');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsakti@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'sakti','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsakti@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'sakti','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('sarangarh-bilaigarh@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'sarangarh-bilaigarh');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsarangarh-bilaigarh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'sarangarh-bilaigarh','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsarangarh-bilaigarh@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'sarangarh-bilaigarh','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('sukma@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'sukma');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsukma@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'sukma','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsukma@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'sukma','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('surajpur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'surajpur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsurajpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'surajpur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsurajpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'surajpur','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('surguja@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'surguja');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northsurguja@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'surguja','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southsurguja@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'surguja','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('khairagarh-chhuikhadan-gandai@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'khairagarh-chhuikhadan-gandai');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northkhairagarh-chhuikhadan-gandai@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'khairagarh-chhuikhadan-gandai','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southkhairagarh-chhuikhadan-gandai@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'khairagarh-chhuikhadan-gandai','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('mohla-manpur-ambagarhchowki@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'mohla-manpur-ambagarhchowki');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northmohla-manpur-ambagarhchowki@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'mohla-manpur-ambagarhchowki','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southmohla-manpur-ambagarhchowki@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'mohla-manpur-ambagarhchowki','south');
INSERT INTO users (email, role, password, state_id, district_name) VALUES ('manendragarh-chirmiri-bharatpur@prithvinet.com','REGIONAL_OFFICER','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'manendragarh-chirmiri-bharatpur');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('northmanendragarh-chirmiri-bharatpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'manendragarh-chirmiri-bharatpur','north');
INSERT INTO users (email, role, password, state_id, district_name, team_zone) VALUES ('southmanendragarh-chirmiri-bharatpur@prithvinet.com','MONITORING_TEAM','prithvinet123',(SELECT id FROM states WHERE state_name='Chhattisgarh'),'manendragarh-chirmiri-bharatpur','south');

SELECT 'PrithviNet seed completed successfully' AS message;





-- =====================================
-- INDUSTRY USERS TABLE
-- =====================================

DROP TABLE IF EXISTS industries CASCADE;

CREATE TABLE IF NOT EXISTS industries (
    id SERIAL PRIMARY KEY,
    industry_email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    state_name TEXT,
    district_name TEXT,
    zone TEXT CHECK(zone IN ('north','south')),
    monitored_by TEXT
);

-- =====================================
-- CHHATTISGARH INDUSTRIES
-- =====================================

INSERT INTO industries (industry_email,password,state_name,district_name,zone,monitored_by) VALUES
('sigc_northraipur@prithvinet.com','prithvinet123','Chhattisgarh','raipur','north','northraipur@prithvinet.com'),
('uia_southraipur@prithvinet.com','prithvinet123','Chhattisgarh','raipur','south','southraipur@prithvinet.com'),

('acc_northdurg@prithvinet.com','prithvinet123','Chhattisgarh','durg','north','northdurg@prithvinet.com'),
('bsp_southdurg@prithvinet.com','prithvinet123','Chhattisgarh','durg','south','southdurg@prithvinet.com'),

('secl_northkorba@prithvinet.com','prithvinet123','Chhattisgarh','korba','north','northkorba@prithvinet.com'),
('ntpc_southkorba@prithvinet.com','prithvinet123','Chhattisgarh','korba','south','southkorba@prithvinet.com'),

('sigc_northbilaspur@prithvinet.com','prithvinet123','Chhattisgarh','bilaspur','north','northbilaspur@prithvinet.com'),
('tia_southbilaspur@prithvinet.com','prithvinet123','Chhattisgarh','bilaspur','south','southbilaspur@prithvinet.com'),

('jspl_northraigarh@prithvinet.com','prithvinet123','Chhattisgarh','raigarh','north','northraigarh@prithvinet.com'),
('mspl_southraigarh@prithvinet.com','prithvinet123','Chhattisgarh','raigarh','south','southraigarh@prithvinet.com'),

('acl_northbalodabazar@prithvinet.com','prithvinet123','Chhattisgarh','balodabazar','north','northbalodabazar@prithvinet.com'),
('ucl_southbalodabazar@prithvinet.com','prithvinet123','Chhattisgarh','balodabazar','south','southbalodabazar@prithvinet.com'),

('kskmpl_northjanjgir@prithvinet.com','prithvinet123','Chhattisgarh','janjgir','north','northjanjgir@prithvinet.com'),
('abvtpw_southjanjgir@prithvinet.com','prithvinet123','Chhattisgarh','janjgir','south','southjanjgir@prithvinet.com'),

('pekb_northsurguja@prithvinet.com','prithvinet123','Chhattisgarh','surguja','north','northsurguja@prithvinet.com'),
('mmssk_southsurguja@prithvinet.com','prithvinet123','Chhattisgarh','surguja','south','southsurguja@prithvinet.com'),

('nisp_northbastar@prithvinet.com','prithvinet123','Chhattisgarh','bastar','north','northbastar@prithvinet.com'),
('tpc_southbastar@prithvinet.com','prithvinet123','Chhattisgarh','bastar','south','southbastar@prithvinet.com'),

('nmdc_northdantewada@prithvinet.com','prithvinet123','Chhattisgarh','dantewada','north','northdantewada@prithvinet.com'),
('nmdc_southdantewada@prithvinet.com','prithvinet123','Chhattisgarh','dantewada','south','southdantewada@prithvinet.com'),

('biop_northkanker@prithvinet.com','prithvinet123','Chhattisgarh','kanker','north','northkanker@prithvinet.com'),
('kfpp_southkanker@prithvinet.com','prithvinet123','Chhattisgarh','kanker','south','southkanker@prithvinet.com'),

('bau_northmahasamund@prithvinet.com','prithvinet123','Chhattisgarh','mahasamund','north','northmahasamund@prithvinet.com'),
('srm_southmahasamund@prithvinet.com','prithvinet123','Chhattisgarh','mahasamund','south','southmahasamund@prithvinet.com'),

('kifp_northdhamtari@prithvinet.com','prithvinet123','Chhattisgarh','dhamtari','north','northdhamtari@prithvinet.com'),
('nhp_southdhamtari@prithvinet.com','prithvinet123','Chhattisgarh','dhamtari','south','southdhamtari@prithvinet.com'),

('bssk_northkawardha@prithvinet.com','prithvinet123','Chhattisgarh','kawardha','north','northkawardha@prithvinet.com'),
('liop_southkawardha@prithvinet.com','prithvinet123','Chhattisgarh','kawardha','south','southkawardha@prithvinet.com'),

('iigc_northrajnandgaon@prithvinet.com','prithvinet123','Chhattisgarh','rajnandgaon','north','northrajnandgaon@prithvinet.com'),
('tfpp_southrajnandgaon@prithvinet.com','prithvinet123','Chhattisgarh','rajnandgaon','south','southrajnandgaon@prithvinet.com'),

('secl_northsurajpur@prithvinet.com','prithvinet123','Chhattisgarh','surajpur','north','northsurajpur@prithvinet.com'),
('sagro_southsurajpur@prithvinet.com','prithvinet123','Chhattisgarh','surajpur','south','southsurajpur@prithvinet.com'),

('secl_northkoriya@prithvinet.com','prithvinet123','Chhattisgarh','koriya','north','northkoriya@prithvinet.com'),
('bengg_southkoriya@prithvinet.com','prithvinet123','Chhattisgarh','koriya','south','southkoriya@prithvinet.com'),

('tgpp_northbalrampur@prithvinet.com','prithvinet123','Chhattisgarh','balrampur','north','northbalrampur@prithvinet.com'),
('ragro_southbalrampur@prithvinet.com','prithvinet123','Chhattisgarh','balrampur','south','southbalrampur@prithvinet.com'),

('ktpp_northjashpur@prithvinet.com','prithvinet123','Chhattisgarh','jashpur','north','northjashpur@prithvinet.com'),
('pagro_southjashpur@prithvinet.com','prithvinet123','Chhattisgarh','jashpur','south','southjashpur@prithvinet.com'),

('npulse_northbemetara@prithvinet.com','prithvinet123','Chhattisgarh','bemetara','north','northbemetara@prithvinet.com'),
('bfood_southbemetara@prithvinet.com','prithvinet123','Chhattisgarh','bemetara','south','southbemetara@prithvinet.com'),

('driom_northbalod@prithvinet.com','prithvinet123','Chhattisgarh','balod','north','northbalod@prithvinet.com'),
('grice_southbalod@prithvinet.com','prithvinet123','Chhattisgarh','balod','south','southbalod@prithvinet.com'),

('lagro_northmungeli@prithvinet.com','prithvinet123','Chhattisgarh','mungeli','north','northmungeli@prithvinet.com'),
('mstone_southmungeli@prithvinet.com','prithvinet123','Chhattisgarh','mungeli','south','southmungeli@prithvinet.com'),

('frice_northgariaband@prithvinet.com','prithvinet123','Chhattisgarh','gariaband','north','northgariaband@prithvinet.com'),
('dgranite_southgariaband@prithvinet.com','prithvinet123','Chhattisgarh','gariaband','south','southgariaband@prithvinet.com'),
('kmfp_northkondagaon@prithvinet.com','prithvinet123','Chhattisgarh','kondagaon','north','northkondagaon@prithvinet.com'),
('mmaka_southkondagaon@prithvinet.com','prithvinet123','Chhattisgarh','kondagaon','south','southkondagaon@prithvinet.com'),

('riop_northnarayanpur@prithvinet.com','prithvinet123','Chhattisgarh','narayanpur','north','northnarayanpur@prithvinet.com'),
('nhandi_southnarayanpur@prithvinet.com','prithvinet123','Chhattisgarh','narayanpur','south','southnarayanpur@prithvinet.com'),

('bbamboo_northbijapur@prithvinet.com','prithvinet123','Chhattisgarh','bijapur','north','northbijapur@prithvinet.com'),
('bmfp_southbijapur@prithvinet.com','prithvinet123','Chhattisgarh','bijapur','south','southbijapur@prithvinet.com'),

('stendu_northsukma@prithvinet.com','prithvinet123','Chhattisgarh','sukma','north','northsukma@prithvinet.com'),
('sagro_southsukma@prithvinet.com','prithvinet123','Chhattisgarh','sukma','south','southsukma@prithvinet.com'),

('pherb_northgpm@prithvinet.com','prithvinet123','Chhattisgarh','gpm','north','northgpm@prithvinet.com'),
('mlac_southgpm@prithvinet.com','prithvinet123','Chhattisgarh','gpm','south','southgpm@prithvinet.com'),

('dpower_northsakti@prithvinet.com','prithvinet123','Chhattisgarh','sakti','north','northsakti@prithvinet.com'),
('ssilk_southsakti@prithvinet.com','prithvinet123','Chhattisgarh','sakti','south','southsakti@prithvinet.com'),

('bforest_northmcb@prithvinet.com','prithvinet123','Chhattisgarh','mcb','north','northmcb@prithvinet.com'),
('secl_southmcb@prithvinet.com','prithvinet123','Chhattisgarh','mcb','south','southmcb@prithvinet.com'),

('aagro_northmma@prithvinet.com','prithvinet123','Chhattisgarh','mma','north','northmma@prithvinet.com'),
('mmfp_southmma@prithvinet.com','prithvinet123','Chhattisgarh','mma','south','southmma@prithvinet.com'),

('brice_northsarangarh@prithvinet.com','prithvinet123','Chhattisgarh','sarangarh','north','northsarangarh@prithvinet.com'),
('stext_southsarangarh@prithvinet.com','prithvinet123','Chhattisgarh','sarangarh','south','southsarangarh@prithvinet.com'),

('gstone_northkcg@prithvinet.com','prithvinet123','Chhattisgarh','kcg','north','northkcg@prithvinet.com'),
('kbrass_southkcg@prithvinet.com','prithvinet123','Chhattisgarh','kcg','south','southkcg@prithvinet.com');

-- =====================================
-- JHARKHAND INDUSTRIES
-- =====================================

INSERT INTO industries (industry_email,password,state_name,district_name,zone,monitored_by) VALUES
('hec_northranchi@prithvinet.com','prithvinet123','Jharkhand','ranchi','north','northranchi@prithvinet.com'),
('riada_southranchi@prithvinet.com','prithvinet123','Jharkhand','ranchi','south','southranchi@prithvinet.com'),

('tsl_northjamshedpur@prithvinet.com','prithvinet123','Jharkhand','east-singhbhum','north','northeast-singhbhum@prithvinet.com'),
('tml_southjamshedpur@prithvinet.com','prithvinet123','Jharkhand','east-singhbhum','south','southeast-singhbhum@prithvinet.com'),

('bsl_northbokaro@prithvinet.com','prithvinet123','Jharkhand','bokaro','north','northbokaro@prithvinet.com'),
('oncg_southbokaro@prithvinet.com','prithvinet123','Jharkhand','bokaro','south','southbokaro@prithvinet.com'),

('bccl_northdhanbad@prithvinet.com','prithvinet123','Jharkhand','dhanbad','north','northdhanbad@prithvinet.com'),
('dvc_southdhanbad@prithvinet.com','prithvinet123','Jharkhand','dhanbad','south','southdhanbad@prithvinet.com'),

('secl_northgiridih@prithvinet.com','prithvinet123','Jharkhand','giridih','north','northgiridih@prithvinet.com'),
('mica_southgiridih@prithvinet.com','prithvinet123','Jharkhand','giridih','south','southgiridih@prithvinet.com'),

('ktps_northkoderma@prithvinet.com','prithvinet123','Jharkhand','koderma','north','northkoderma@prithvinet.com'),
('mica_southkoderma@prithvinet.com','prithvinet123','Jharkhand','koderma','south','southkoderma@prithvinet.com'),

('dap_northdeoghar@prithvinet.com','prithvinet123','Jharkhand','deoghar','north','northdeoghar@prithvinet.com'),
('agro_southdeoghar@prithvinet.com','prithvinet123','Jharkhand','deoghar','south','southdeoghar@prithvinet.com'),

('agro_northdumka@prithvinet.com','prithvinet123','Jharkhand','dumka','north','northdumka@prithvinet.com'),
('silk_southdumka@prithvinet.com','prithvinet123','Jharkhand','dumka','south','southdumka@prithvinet.com'),

('ccl_northpalamu@prithvinet.com','prithvinet123','Jharkhand','palamu','north','northpalamu@prithvinet.com'),
('agro_southpalamu@prithvinet.com','prithvinet123','Jharkhand','palamu','south','southpalamu@prithvinet.com'),

('hind_northgarhwa@prithvinet.com','prithvinet123','Jharkhand','garhwa','north','northgarhwa@prithvinet.com'),
('agro_southgarhwa@prithvinet.com','prithvinet123','Jharkhand','garhwa','south','southgarhwa@prithvinet.com'),

('ccl_northlatehar@prithvinet.com','prithvinet123','Jharkhand','latehar','north','northlatehar@prithvinet.com'),
('essar_southlatehar@prithvinet.com','prithvinet123','Jharkhand','latehar','south','southlatehar@prithvinet.com'),

('hind_northlohardaga@prithvinet.com','prithvinet123','Jharkhand','lohardaga','north','northlohardaga@prithvinet.com'),
('agro_southlohardaga@prithvinet.com','prithvinet123','Jharkhand','lohardaga','south','southlohardaga@prithvinet.com'),

('baux_northgumla@prithvinet.com','prithvinet123','Jharkhand','gumla','north','northgumla@prithvinet.com'),
('agro_southgumla@prithvinet.com','prithvinet123','Jharkhand','gumla','south','southgumla@prithvinet.com'),
('agro_northsimdega@prithvinet.com','prithvinet123','Jharkhand','simdega','north','northsimdega@prithvinet.com'),
('mfp_southsimdega@prithvinet.com','prithvinet123','Jharkhand','simdega','south','southsimdega@prithvinet.com'),

('lac_northkhunti@prithvinet.com','prithvinet123','Jharkhand','khunti','north','northkhunti@prithvinet.com'),
('agro_southkhunti@prithvinet.com','prithvinet123','Jharkhand','khunti','south','southkhunti@prithvinet.com'),

('clw_northjamtara@prithvinet.com','prithvinet123','Jharkhand','jamtara','north','northjamtara@prithvinet.com'),
('agro_southjamtara@prithvinet.com','prithvinet123','Jharkhand','jamtara','south','southjamtara@prithvinet.com'),

('ecl_northgodda@prithvinet.com','prithvinet123','Jharkhand','godda','north','northgodda@prithvinet.com'),
('adani_southgodda@prithvinet.com','prithvinet123','Jharkhand','godda','south','southgodda@prithvinet.com'),

('quar_northsahibganj@prithvinet.com','prithvinet123','Jharkhand','sahibganj','north','northsahibganj@prithvinet.com'),
('agro_southsahibganj@prithvinet.com','prithvinet123','Jharkhand','sahibganj','south','southsahibganj@prithvinet.com'),

('ecl_northpakur@prithvinet.com','prithvinet123','Jharkhand','pakur','north','northpakur@prithvinet.com'),
('quar_southpakur@prithvinet.com','prithvinet123','Jharkhand','pakur','south','southpakur@prithvinet.com'),

('ccl_northchatra@prithvinet.com','prithvinet123','Jharkhand','chatra','north','northchatra@prithvinet.com'),
('ntpc_southchatra@prithvinet.com','prithvinet123','Jharkhand','chatra','south','southchatra@prithvinet.com');

-- Normalize monitored_by to the matching monitoring-team email when available.
UPDATE industries i
SET monitored_by = LOWER(i.zone || i.district_name || '@prithvinet.com')
WHERE EXISTS (
    SELECT 1
    FROM users u
    WHERE u.email = LOWER(i.zone || i.district_name || '@prithvinet.com')
)
AND (i.monitored_by IS NULL OR i.monitored_by <> LOWER(i.zone || i.district_name || '@prithvinet.com'));

