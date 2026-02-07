const menuCodeFromPath = (path) => (path ? `menu:${path}` : null);

const cloneMenuItem = (item) => {
  if (!item) return item;
  const cloned = { ...item };
  if (Array.isArray(item.children)) {
    cloned.children = item.children.map(cloneMenuItem);
  }
  return cloned;
};

const collectPaths = (items, set) => {
  (items || []).forEach(item => {
    if (!item || !item.path) return;
    set.add(item.path);
    if (Array.isArray(item.children) && item.children.length > 0) {
      collectPaths(item.children, set);
    }
  });
};

const findNodeWithChildren = (items, predicate) => {
  const list = Array.isArray(items) ? items : [];
  for (const item of list) {
    if (!item) continue;
    if (Array.isArray(item.children) && item.children.length > 0 && predicate(item)) {
      return item;
    }
    const found = findNodeWithChildren(item.children, predicate);
    if (found) return found;
  }
  return null;
};

const findParentContainerByChildPrefix = (items, basePrefix) => {
  return findNodeWithChildren(items, (node) => {
    return (node.children || []).some(child => child?.path && child.path.startsWith(basePrefix));
  });
};

const insertMenuItem = (items, targetItem) => {
  if (!targetItem?.path) return;
  const targetPath = targetItem.path;
  const segments = targetPath.split('/').filter(Boolean);
  const basePrefix = segments.length > 0 ? `/${segments[0]}` : targetPath;

  // 1) Prefer inserting under an existing container with the same base prefix.
  const container = findParentContainerByChildPrefix(items, basePrefix)
    || findNodeWithChildren(items, (node) => node.path === basePrefix);

  if (container && Array.isArray(container.children)) {
    const siblings = container.children;
    if (siblings.some(s => s?.path === targetPath)) return;

    // Insert after the last sibling sharing the same prefix to keep grouping.
    let insertAt = siblings.length;
    for (let i = 0; i < siblings.length; i += 1) {
      const p = siblings[i]?.path || '';
      if (p.startsWith(basePrefix)) {
        insertAt = i + 1;
      }
    }
    siblings.splice(insertAt, 0, targetItem);
    return;
  }

  // 2) Fallback: insert as a top-level menu item.
  if (!items.some(s => s?.path === targetPath)) {
    items.push(targetItem);
  }
};

// Injects menu items that the user is explicitly granted (menuCodes),
// but are missing from the base-role menu config.
export const buildAugmentedMenus = ({ baseMenus, allowedMenuCodes, getCatalogItemByPath }) => {
  const cloned = (baseMenus || []).map(cloneMenuItem);
  const existingPaths = new Set();
  collectPaths(cloned, existingPaths);

  // Some permissioned menu paths are implemented as redirects behind a simpler sidebar entry.
  // Avoid injecting duplicate entries for these cases.
  const pathAliases = new Map([
    ['/position-work/field', '/position-work']
  ]);

  const allowedPaths = (allowedMenuCodes || [])
    .filter(code => typeof code === 'string' && code.startsWith('menu:/'))
    .map(code => code.slice(5));

  allowedPaths.forEach((path) => {
    if (!path || existingPaths.has(path)) return;
    const alias = pathAliases.get(path);
    if (alias && existingPaths.has(alias)) return;
    const catalog = getCatalogItemByPath ? getCatalogItemByPath(path) : null;
    if (!catalog) return;
    const item = cloneMenuItem(catalog);
    insertMenuItem(cloned, item);
    existingPaths.add(path);
  });

  return cloned;
};

// Filters menus using:
// - allowedMenuCodes: current user's allowed menu codes (after base + allow/deny)
// - isKnownMenuCode: whether a menu code exists in the system permission catalog
export const filterMenusByMenuCodes = ({ menus, allowedMenuCodes, isKnownMenuCode }) => {
  const allowedSet = new Set(allowedMenuCodes || []);

  const filter = (items, ancestorKnownAllowed) => {
    return (items || []).reduce((acc, item) => {
      if (!item || !item.path) return acc;
      const code = menuCodeFromPath(item.path);
      const known = code ? (isKnownMenuCode ? isKnownMenuCode(code) : true) : false;
      const selfAllowed = code ? allowedSet.has(code) : false;

      const nextAncestorKnownAllowed = ancestorKnownAllowed || (known && selfAllowed);
      const children = Array.isArray(item.children) && item.children.length > 0
        ? filter(item.children, nextAncestorKnownAllowed)
        : null;
      const hasChildren = Array.isArray(children) && children.length > 0;

      if (known) {
        // Known menu nodes are controlled by their own menu permission.
        if (!selfAllowed && !hasChildren) return acc;
      } else {
        // Virtual nodes:
        // - containers show if any child is visible
        // - leaf nodes show if some allowed known ancestor exists
        if (!hasChildren && !nextAncestorKnownAllowed) return acc;
      }

      acc.push({
        ...item,
        children: hasChildren ? children : (Array.isArray(item.children) ? [] : undefined)
      });
      return acc;
    }, []);
  };

  return filter(menus || [], false);
};
