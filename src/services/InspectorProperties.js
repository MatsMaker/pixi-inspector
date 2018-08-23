import filterProperties from "./properties/index";

function onlyUniquePath(value, index, self) {
  return self.findIndex(v => v.path === value.path) === index;
}

class MismatchConstructor {}

export default class InspectorProperties {
  constructor(inspector) {
    const PIXI = inspector.instance.PIXI;
    this.TransformBaseRef =
      typeof PIXI.TransformBase === "function"
        ? PIXI.TransformBase
        : MismatchConstructor;
    this.ObservablePointRef =
      typeof PIXI.ObservablePoint === "function"
        ? PIXI.ObservablePoint
        : MismatchConstructor;
    // this.Point = PIXI.Point
  }
  all() {
    if (!window.$pixi) {
      return [];
    }
    const properties = [];
    filterProperties(window.$pixi, properties).forEach(property => {
      properties.push(...this.serialize(window.$pixi[property], [property], 3));
    });
    properties.sort((a, b) => (a.path > b.path ? 1 : -1));
    const clearList = properties.filter(onlyUniquePath); //TODO need not push dublicated
    return clearList;
  }
  /* eslint-disable */
  set(path, value) {
    eval("$pixi." + path + " = " + JSON.stringify(value));
  }
  /* eslint-enable */

  serialize(value, path, depth) {
    depth--;
    if (depth < 0) {
      return [];
    }
    const type = typeof value;
    if (type === "undefined" || type === "function") {
      return [];
    } else if (
      type === "string" ||
      type === "number" ||
      type === "boolean" ||
      value === null
    ) {
      return [{ path: path.join("."), type, value }];
    } else if (type === "object") {
      if (value === null) {
        return [{ path: path.join("."), type, value }];
      }
      if (Array.isArray(value)) {
        return [{ path: path.join("."), type: "Array" }];
      }
      const properties = [];
      filterProperties(value, properties).forEach(property => {
        // if (properties.find(property => path === property.path)) {
        // } else {
        properties.push(
          ...this.serialize(value[property], [...path, property], depth)
        );
        // }
      });
      if (value instanceof this.ObservablePointRef) {
        properties.push(
          {
            path: path.join(".") + ".x",
            type: "number",
            value: value.x
          },
          {
            path: path.join(".") + ".y",
            type: "number",
            value: value.y
          }
        );
      }
      if (value instanceof this.TransformBaseRef) {
        properties.push({
          path: path.join(".") + ".rotation",
          type: "number",
          value: value.rotation
        });
      }
      if (properties.length !== 0) {
        return properties;
      }
      // (typeof value.constructor ? (value.constructor.name || type) : type
      return [{ path: path.join("."), type: "Object" }];
    }
    return [
      {
        path: path.join("."),
        type:
          typeof value.constructor !== "undefined"
            ? value.constructor.name || type
            : type
      }
    ];
  }
}
