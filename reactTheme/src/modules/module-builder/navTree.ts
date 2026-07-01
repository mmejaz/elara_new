/**
 * Build TreeSelect-compatible parent options from the live module tree
 * (fetched from /modules/tree). Groups and menu items are both selectable so a
 * new module can be placed under a section or nested under an existing item.
 *
 * Value encoding matches the backend's parent resolver:
 *   - group  → "group:<Name>"  (resolved by slug of the name)
 *   - item   → "<slug>"        (resolved directly by slug)
 */
export function buildParentOptions(tree = []) {
  const toNode = (node) => ({
    title: node.name,
    value: node.type === 'group' ? `group:${node.name}` : node.slug,
    selectable: true,
    children: node.children?.length ? node.children.map(toNode) : undefined,
  })

  return tree.map(toNode)
}
