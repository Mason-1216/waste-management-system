import { adminMenus } from './menu_admin';
import { clientMenus } from './menu_client';
import { departmentManagerMenus } from './menu_department_manager';
import { deputyManagerMenus } from './menu_deputy_manager';
import { devTestMenus } from './menu_dev_test';
import { maintenanceMenus } from './menu_maintenance';
import { operatorMenus } from './menu_operator';
import { safetyInspectorMenus } from './menu_safety_inspector';
import { seniorManagementMenus } from './menu_senior_management';
import { stationManagerMenus } from './menu_station_manager';
import { bottomMenus } from './menu_bottom';

export const menuConfig = {
  admin: adminMenus,
  dev_test: devTestMenus,
  operator: operatorMenus,
  maintenance: maintenanceMenus,
  station_manager: stationManagerMenus,
  deputy_manager: deputyManagerMenus,
  department_manager: departmentManagerMenus,
  safety_inspector: safetyInspectorMenus,
  senior_management: seniorManagementMenus,
  client: clientMenus
};

export { bottomMenus };

export default menuConfig;
