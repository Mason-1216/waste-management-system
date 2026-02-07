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

// A catalog of menu item definitions indexed by `path`.
// Used to "inject" user-granted menu items that are not present in the base-role menu config.
const buildMenuPathCatalog = () => {
  const pathMap = new Map();
  const walk = (items) => {
    (items || []).forEach((item) => {
      if (!item || !item.path) return;
      if (!pathMap.has(item.path)) {
        // Keep only the fields we need for rendering.
        const normalized = {
          path: item.path,
          name: item.name,
          icon: item.icon,
          requiresPriceAdmin: item.requiresPriceAdmin,
          isAction: item.isAction,
          children: item.children ? item.children.map(child => ({ ...child })) : null
        };
        pathMap.set(item.path, normalized);
      }
      if (Array.isArray(item.children) && item.children.length > 0) {
        walk(item.children);
      }
    });
  };

  Object.values(menuConfig).forEach(walk);
  return pathMap;
};

export const menuPathCatalog = buildMenuPathCatalog();
export const getMenuCatalogItemByPath = (path) => menuPathCatalog.get(path);

export default menuConfig;
