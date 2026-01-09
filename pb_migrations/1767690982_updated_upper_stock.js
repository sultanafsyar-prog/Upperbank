/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2178506470")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number1475513172",
    "max": null,
    "min": null,
    "name": "size",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2178506470")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number1475513172",
    "max": null,
    "min": null,
    "name": "Size",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
