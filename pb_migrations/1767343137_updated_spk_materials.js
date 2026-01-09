/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number302785506",
    "max": null,
    "min": null,
    "name": "qty_in",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number302785506",
    "max": null,
    "min": null,
    "name": "qty_in",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
