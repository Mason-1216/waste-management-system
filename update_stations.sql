SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
DELETE FROM user_stations;
DELETE FROM project_stations;
DELETE FROM stations;
ALTER TABLE stations AUTO_INCREMENT=1;
SET FOREIGN_KEY_CHECKS=1;

INSERT INTO stations (station_name, station_type, location, status) VALUES
(CONVERT(0xe6b5b7e6b780e58cbae7acace4b880e69c89e69cbae8b584e6ba90e4b8ade5bf83 USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe69dbfe4ba95e7ab99 USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe58c97e888aae7ab99 USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe58c97e5a496e7ab99 USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe58c97e5b888e5a4a7 USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe6b299e99381e7ab99 USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe4b8ade585b3e69d91e4b880e5b08fe8a5bfe4ba8ce69797e58886e6a0a1 USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe4b8ade585b3e69d91e4b880e5b08fe68080e69f94e58886e6a0a1 USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe7b4abe7abb9e999a2 USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe4b889e6989fe5ba84 USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe6b5b7e6b780e4b880e58a9ee7ab99 USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe68080e69f94e8a5bfe88cb6e59d9e USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe59bbde888aa USING utf8mb4), 1, NULL, 'active'),
(CONVERT(0xe680bbe983a8e58a9ee585ace58cba USING utf8mb4), 4, NULL, 'active'),
(CONVERT(0xe68080e69f94e58a9ee585ace58cba USING utf8mb4), 4, NULL, 'active'),
(CONVERT(0xe5b9b3e4b989e58886e7ab99 USING utf8mb4), 1, NULL, 'active')
;

INSERT INTO project_stations (project_id, station_id) VALUES (1, 1);
INSERT INTO user_stations (user_id, station_id) VALUES (1, 1);